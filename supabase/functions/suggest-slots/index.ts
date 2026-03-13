import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { student_id, organization_id, date, preferred_duration } = await req.json();

    if (!student_id || !organization_id || !date) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch existing lessons for the date
    const { data: existingLessons } = await supabase
      .from("lessons")
      .select("instructor_id, vehicle_id, start_time, end_time")
      .eq("organization_id", organization_id)
      .eq("date", date)
      .in("status", ["prevu", "effectue"]);

    // Fetch active instructors
    const { data: instructors } = await supabase
      .from("instructors")
      .select("id, first_name, last_name")
      .eq("organization_id", organization_id)
      .eq("status", "actif");

    // Fetch active vehicles
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, brand, model, plate")
      .eq("organization_id", organization_id)
      .eq("status", "actif");

    // Fetch instructor availabilities for the day of week
    const dayOfWeek = (new Date(date).getDay() + 6) % 7; // Convert JS Sunday=0 to Monday=0
    const { data: availabilities } = await supabase
      .from("instructor_availabilities")
      .select("instructor_id, start_time, end_time")
      .eq("organization_id", organization_id)
      .eq("day_of_week", dayOfWeek);

    const duration = preferred_duration || 1;
    const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const workStart = 8; // 8:00
    const workEnd = 19; // 19:00
    const slotDuration = duration; // in hours

    // Generate possible time slots
    const timeSlots: string[] = [];
    for (let h = workStart; h <= workEnd - slotDuration; h++) {
      for (const m of [0, 30]) {
        if (h + (m === 30 ? 0.5 : 0) + slotDuration > workEnd) continue;
        timeSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }

    // Build prompt for AI
    const lessonsStr = (existingLessons || []).map(l =>
      `Instructor ${l.instructor_id} & Vehicle ${l.vehicle_id}: ${l.start_time}-${l.end_time}`
    ).join("\n");

    const instructorsStr = (instructors || []).map(i => `${i.id}: ${i.first_name} ${i.last_name}`).join("\n");
    const vehiclesStr = (vehicles || []).map(v => `${v.id}: ${v.brand} ${v.model} (${v.plate})`).join("\n");
    const availStr = (availabilities || []).map(a => `Instructor ${a.instructor_id}: ${a.start_time}-${a.end_time}`).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant de planification pour un centre de formation taxi/VTC. Tu dois suggérer les 3 meilleurs créneaux pour une séance de ${duration}h le ${date}.

Critères d'optimisation:
1. Pas de conflit avec les séances existantes (même formateur ou même véhicule)
2. RESPECTER les disponibilités des formateurs (ne proposer que les créneaux dans leurs plages horaires)
3. Privilégier les créneaux qui comblent les trous dans le planning
4. Privilégier les heures de début classiques (9h, 10h, 14h, 15h)
5. Varier les formateurs si possible

Réponds UNIQUEMENT avec un JSON valide au format:
[{"start_time":"HH:MM","end_time":"HH:MM","instructor_id":"uuid","vehicle_id":"uuid","reason":"explication courte"}]`
          },
          {
            role: "user",
            content: `Séances existantes le ${date}:\n${lessonsStr || "Aucune"}\n\nDisponibilités formateurs le ${DAYS[dayOfWeek] || date}:\n${availStr || "Non configurées (considérer 8h-19h)"}\n\nFormateurs disponibles:\n${instructorsStr || "Aucun"}\n\nVéhicules disponibles:\n${vehiclesStr || "Aucun"}\n\nCréneaux possibles: ${timeSlots.join(", ")}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse AI response - extract JSON
    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response:", content);
      suggestions = [];
    }

    // Enrich suggestions with names
    const enriched = suggestions.map((s: any) => {
      const instructor = (instructors || []).find(i => i.id === s.instructor_id);
      const vehicle = (vehicles || []).find(v => v.id === s.vehicle_id);
      return {
        ...s,
        instructor_name: instructor ? `${instructor.first_name} ${instructor.last_name}` : "Inconnu",
        vehicle_name: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "Inconnu",
      };
    });

    return new Response(JSON.stringify({ suggestions: enriched }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-slots error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
