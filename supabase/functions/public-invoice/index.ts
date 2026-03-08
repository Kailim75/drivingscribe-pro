import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");
    if (!invoiceId) throw new Error("id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("number, type, status, total_ht, tva_amount, total_ttc, paid_amount, remaining_amount, issue_date, due_date, organization_id, invoice_lines(description, quantity, unit_price, total_ht), students(first_name, last_name)")
      .eq("id", invoiceId)
      .single();
    if (error || !invoice) throw new Error("Invoice not found");

    const { data: org } = await supabase
      .from("organizations")
      .select("name, email, phone, address, siret, tva_number, currency")
      .eq("id", invoice.organization_id)
      .single();

    // Remove organization_id from response
    const { organization_id, ...invoiceData } = invoice;

    return new Response(
      JSON.stringify({ invoice: invoiceData, organization: org }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
