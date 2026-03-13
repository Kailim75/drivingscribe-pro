import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  console.log(`[webhook] ${req.method} received from ${req.headers.get("origin") || req.headers.get("referer") || "unknown"}`);
  console.log(`[webhook] Headers: content-type=${req.headers.get("content-type")}, x-api-key=${req.headers.get("x-api-key") ? "present" : "missing"}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log(`[webhook] Rejected: method ${req.method}`);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Authenticate via X-Api-Key header matching the org's webhook_api_key
    const apiKey = req.headers.get("x-api-key") || req.headers.get("X-Api-Key") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the organization by its webhook_api_key
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, webhook_calls_count")
      .eq("webhook_api_key", apiKey)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment webhook calls counter
    await supabase
      .from("organizations")
      .update({ webhook_calls_count: (org.webhook_calls_count || 0) + 1 })
      .eq("id", org.id);

    const rawBody = await req.text();
    console.log(`[webhook] Body received (${rawBody.length} chars):`, rawBody.substring(0, 500));
    
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("[webhook] JSON parse error:", parseErr);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractStudents = (payload: any): any[] => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.students)) return payload.students;
      if (Array.isArray(payload?.data)) return payload.data;
      if (payload?.student && typeof payload.student === "object") return [payload.student];
      if (payload?.data && typeof payload.data === "object") return [payload.data];
      return [payload];
    };

    const normalizeActivityType = (value: unknown): string => {
      const raw = String(value ?? "").trim().toLowerCase();
      if (!raw) return "auto_ecole";

      const normalized = raw.replace(/\s+/g, "_").replace(/-/g, "_");
      if (normalized.includes("vtc")) return "vtc";
      if (normalized.includes("taxi")) return "taxi";
      if (normalized.includes("vmdtr")) return "vmdtr";
      if (normalized.includes("auto") || normalized.includes("ecole")) return "auto_ecole";

      return normalized;
    };

    const students = extractStudents(body);
    const results: { success: boolean; name?: string; error?: string }[] = [];

    for (const s of students) {
      const firstName = s.first_name || s.prenom || s.firstName || s.firstname || "";
      const lastName = s.last_name || s.nom || s.lastName || s.lastname || "";

      if (!firstName || !lastName) {
        results.push({ success: false, error: "Prénom ou nom manquant (payload non reconnu)" });
        continue;
      }

      const { error: insertError } = await supabase.from("students").insert({
        organization_id: org.id,
        first_name: firstName,
        last_name: lastName,
        phone: s.phone || s.telephone || s.tel || "",
        email: s.email || "",
        activity_type: normalizeActivityType(s.activity_type || s.type_activite),
        address: s.address || s.adresse || "",
        notes: s.notes || "",
      });

      if (insertError) {
        results.push({ success: false, name: `${firstName} ${lastName}`, error: insertError.message });
      } else {
        results.push({ success: true, name: `${firstName} ${lastName}` });
      }
    }

    const imported = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({ imported, failed, details: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
