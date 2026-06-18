import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const configuredSecret = Deno.env.get("AUTO_REMINDERS_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");

    if (!configuredSecret) {
      return new Response(
        JSON.stringify({ error: "AUTO_REMINDERS_SECRET is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (providedSecret !== configuredSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all orgs with auto reminders enabled
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("organization_id")
      .eq("auto_reminder_enabled", true);

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ message: "No orgs with auto reminders enabled", created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .split("T")[0];
    let totalCreated = 0;

    for (const setting of settings) {
      const orgId = setting.organization_id;

      // Find overdue invoices: due_date < 7 days ago, type facture, not paid/cancelled/archived/draft
      const { data: overdueInvoices } = await supabase
        .from("invoices")
        .select("id, number, student_id, total_ttc, remaining_amount, due_date")
        .eq("organization_id", orgId)
        .eq("type", "facture")
        .lt("due_date", sevenDaysAgo)
        .gt("remaining_amount", 0)
        .not("status", "in", '("payé","annulé","archivé","brouillon")');

      if (!overdueInvoices || overdueInvoices.length === 0) continue;

      for (const invoice of overdueInvoices) {
        // Idempotency: check if a reminder was already created for this invoice in the last 7 days
        const { data: existing } = await supabase
          .from("reminders")
          .select("id")
          .eq("invoice_id", invoice.id)
          .eq("type", "impayé")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
          .limit(1);

        if (existing && existing.length > 0) continue;

        const message = `Relance automatique : Facture ${invoice.number} — ${invoice.remaining_amount} € restant dû (échéance : ${invoice.due_date})`;

        const { error } = await supabase.from("reminders").insert({
          organization_id: orgId,
          type: "impayé",
          channel: "email",
          student_id: invoice.student_id,
          invoice_id: invoice.id,
          message,
          scheduled_at: new Date().toISOString(),
          status: "planifié",
        });

        if (!error) {
          totalCreated++;
          // Audit log
          await supabase.from("audit_logs").insert({
            organization_id: orgId,
            action: "Relance auto créée",
            entity: "reminder",
            entity_id: invoice.id,
            details: message,
            user_name: "Système",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ created: totalCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
