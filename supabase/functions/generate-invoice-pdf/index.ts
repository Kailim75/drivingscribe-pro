import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsPDF } from "npm:jspdf@2.5.2";

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
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, invoice_lines(*), students(first_name, last_name, email, phone, address), payers(name, email, phone, address, siret)")
      .eq("id", invoice_id)
      .single();
    if (error || !invoice) throw new Error("Invoice not found");

    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", invoice.organization_id)
      .single();
    if (!org) throw new Error("Organization not found");

    const isDevis = invoice.type === "devis";
    const docLabel = isDevis ? "DEVIS" : "FACTURE";

    // Create PDF
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 20;

    // Header - Organization info
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(org.name, margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    if (org.address) { doc.text(org.address, margin, y); y += 4; }
    if (org.phone) { doc.text(`Tél: ${org.phone}`, margin, y); y += 4; }
    if (org.email) { doc.text(org.email, margin, y); y += 4; }
    if (org.siret) { doc.text(`SIRET: ${org.siret}`, margin, y); y += 4; }
    if (org.tva_number) { doc.text(`TVA: ${org.tva_number}`, margin, y); y += 4; }

    // Document title
    y += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(`${docLabel} ${invoice.number}`, margin, y);
    y += 10;

    // Dates
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    doc.text(`Date d'émission : ${formatDate(invoice.issue_date)}`, margin, y);
    y += 4;
    doc.text(`Date d'échéance : ${formatDate(invoice.due_date)}`, margin, y);
    y += 4;
    doc.text(`Statut : ${invoice.status}`, margin, y);
    y += 8;

    // Client info - show payer if grouped, otherwise student
    const payer = invoice.payer_id ? invoice.payers : null;
    const student = invoice.students;
    const recipientName = payer ? payer.name : (student ? `${student.first_name} ${student.last_name}` : "");
    const recipientEmail = payer ? payer.email : student?.email;
    const recipientPhone = payer ? payer.phone : student?.phone;
    const recipientSiret = payer?.siret;

    if (recipientName) {
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(pageW / 2, 20, contentW / 2, recipientSiret ? 33 : 28, 2, 2, "F");
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(payer ? "TIERS PAYEUR" : "DESTINATAIRE", pageW / 2 + 5, 26);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(recipientName, pageW / 2 + 5, 32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      let ry = 37;
      if (recipientEmail) { doc.text(recipientEmail, pageW / 2 + 5, ry); ry += 5; }
      if (recipientPhone) { doc.text(recipientPhone, pageW / 2 + 5, ry); ry += 5; }
      if (recipientSiret) { doc.text(`SIRET: ${recipientSiret}`, pageW / 2 + 5, ry); }
    }

    // Table header
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, y, contentW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", margin + 3, y + 5.5);
    doc.text("QTÉ", margin + 105, y + 5.5);
    doc.text("P.U. HT", margin + 120, y + 5.5);
    doc.text("TOTAL HT", margin + 148, y + 5.5, { align: "right" } as any);
    y += 8;

    // Table rows
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    const lines = invoice.invoice_lines || [];
    const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

    lines.forEach((line: any, i: number) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentW, 7, "F");
      }
      doc.setFontSize(9);
      doc.text(line.description || "", margin + 3, y + 5);
      doc.text(String(line.quantity), margin + 105, y + 5);
      doc.text(formatEur(line.unit_price), margin + 120, y + 5);
      doc.text(formatEur(line.total_ht), margin + 148, y + 5, { align: "right" } as any);
      y += 7;
    });

    // Totals
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 100, y, margin + contentW, y);
    y += 6;
    doc.setFontSize(9);
    doc.text("Total HT", margin + 105, y);
    doc.text(formatEur(invoice.total_ht), margin + 148, y, { align: "right" } as any);
    y += 5;
    doc.text(`TVA (${org.tva_rate}%)`, margin + 105, y);
    doc.text(formatEur(invoice.tva_amount), margin + 148, y, { align: "right" } as any);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin + 98, y - 4.5, contentW - 98, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("Total TTC", margin + 105, y + 1.5);
    doc.text(formatEur(invoice.total_ttc), margin + 148, y + 1.5, { align: "right" } as any);

    // Payment info for invoices
    if (!isDevis && invoice.paid_amount > 0) {
      y += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Déjà payé : ${formatEur(invoice.paid_amount)}`, margin + 105, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text(`Reste à payer : ${formatEur(invoice.remaining_amount)}`, margin + 105, y);
    }

    // Notes
    if (invoice.notes) {
      y += 15;
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Notes :", margin, y);
      y += 4;
      doc.text(invoice.notes, margin, y, { maxWidth: contentW });
    }

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text(`${org.name} — ${org.siret || ""} — ${org.tva_number || ""}`, pageW / 2, 285, { align: "center" });

    // Convert to base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    return new Response(
      JSON.stringify({ pdf: pdfBase64, filename: `${docLabel}_${invoice.number}.pdf` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
