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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");

    const { data: invoice, error } = await authClient
      .from("invoices")
      .select("*, invoice_lines(*), students(first_name, last_name, email, phone, address), payers(name, email, phone, address, siret)")
      .eq("id", invoice_id)
      .single();
    if (error || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: corsHeaders });
    }

    // Refuse to generate an empty PDF (invoice header without any lines)
    if (!invoice.invoice_lines || invoice.invoice_lines.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cette facture ne contient aucune prestation. Ajoutez des lignes avant de générer le PDF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: org } = await authClient
      .from("organizations")
      .select("*")
      .eq("id", invoice.organization_id)
      .single();
    if (!org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), { status: 404, headers: corsHeaders });
    }

    const isDevis = invoice.type === "devis";
    const docLabel = isDevis ? "DEVIS" : "FACTURE";

    // Fiscal regime
    const tvaRegime = org.tva_regime || "assujetti";
    const isFranchise = tvaRegime === "franchise_en_base";
    const franchiseMention = "TVA non applicable, art. 293 B du CGI";

    // Branding config
    const primaryColor = hexToRgb(org.primary_color || "#1e40af");
    const docLogoUrl = org.document_logo_url || org.logo_url || null;
    const website = org.website || null;
    const documentHeader = org.document_header || null;
    const footerText = org.footer_text || "";
    const legalMentions = org.legal_mentions || "";
    const signatureEnabled = org.signature_enabled || false;
    const signatureText = org.signature_text || "";
    const template = org.document_template || "moderne";
    const isMinimal = template === "minimaliste";
    const isClassic = template === "classique";
    const headerColor = isMinimal ? { r: 51, g: 51, b: 51 } : isClassic ? { r: 85, g: 85, b: 85 } : primaryColor;
    const tableHeaderColor = isMinimal ? { r: 51, g: 51, b: 51 } : isClassic ? { r: 85, g: 85, b: 85 } : primaryColor;

    // Create PDF
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 20;

    // Try to add logo
    let logoAdded = false;
    if (docLogoUrl && !isMinimal) {
      try {
        const logoRes = await fetch(docLogoUrl);
        if (logoRes.ok) {
          const buf = await logoRes.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          const ext = docLogoUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG";
          doc.addImage(`data:image/${ext.toLowerCase()};base64,${base64}`, ext, margin, y, 25, 25);
          logoAdded = true;
        }
      } catch { /* skip logo */ }
    }

    const textStartX = logoAdded ? margin + 30 : margin;

    // Header - Organization info
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
    doc.text(org.name, textStartX, y + (logoAdded ? 5 : 0));

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    let hy = y + (logoAdded ? 10 : 7);
    if (documentHeader) { doc.text(documentHeader, textStartX, hy); hy += 4; }
    if (org.address) { doc.text(org.address, textStartX, hy); hy += 4; }
    if (org.phone) { doc.text(`Tél: ${org.phone}`, textStartX, hy); hy += 4; }
    if (org.email) { doc.text(org.email, textStartX, hy); hy += 4; }
    if (website) { doc.text(website, textStartX, hy); hy += 4; }
    if (org.siret) { doc.text(`SIRET: ${org.siret}`, textStartX, hy); hy += 4; }
    if (org.tva_number) { doc.text(`TVA: ${org.tva_number}`, textStartX, hy); hy += 4; }

    y = Math.max(hy, logoAdded ? y + 28 : hy);

    // Document title
    y += 6;
    doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
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

    // Client info
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
    doc.setFillColor(tableHeaderColor.r, tableHeaderColor.g, tableHeaderColor.b);
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
      if (!isMinimal && i % 2 === 0) {
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

    if (isFranchise) {
      // Franchise en base: only show total, no TVA
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setFillColor(tableHeaderColor.r, tableHeaderColor.g, tableHeaderColor.b);
      doc.rect(margin + 98, y - 4.5, contentW - 98, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Total", margin + 105, y + 1.5);
      doc.text(formatEur(invoice.total_ht), margin + 148, y + 1.5, { align: "right" } as any);
      y += 12;
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(franchiseMention, margin, y);
    } else {
      // Assujetti: show HT + TVA + TTC
      doc.text("Total HT", margin + 105, y);
      doc.text(formatEur(invoice.total_ht), margin + 148, y, { align: "right" } as any);
      y += 5;
      doc.text(`TVA (${org.tva_rate}%)`, margin + 105, y);
      doc.text(formatEur(invoice.tva_amount), margin + 148, y, { align: "right" } as any);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setFillColor(tableHeaderColor.r, tableHeaderColor.g, tableHeaderColor.b);
      doc.rect(margin + 98, y - 4.5, contentW - 98, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Total TTC", margin + 105, y + 1.5);
      doc.text(formatEur(invoice.total_ttc), margin + 148, y + 1.5, { align: "right" } as any);
    }

    // Payment info
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

    // Signature block
    if (signatureEnabled) {
      y += 20;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(signatureText || "Signature", margin + 110, y);
      y += 15;
      doc.setDrawColor(180, 180, 180);
      doc.line(margin + 110, y, margin + contentW, y);
    }

    // Legal mentions
    if (legalMentions) {
      y += 12;
      doc.setTextColor(130, 130, 130);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(legalMentions, margin, y, { maxWidth: contentW });
    }

    // Footer on page 1
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    const footerParts = [org.name, org.siret, isFranchise ? null : org.tva_number, website].filter(Boolean).join(" — ");
    const footerY = 285;
    if (footerText) {
      doc.text(footerText, pageW / 2, footerY - 4, { align: "center" });
    }
    doc.text(footerParts, pageW / 2, footerY, { align: "center" });

    // CGV page (if configured)
    const cgvText = org.cgv_text || "";
    if (cgvText.trim()) {
      doc.addPage();
      let cy = 25;

      // CGV title
      doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CONDITIONS GÉNÉRALES DE VENTE", margin, cy);
      cy += 10;

      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, cy, margin + contentW, cy);
      cy += 8;

      // CGV body
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const cgvLines = doc.splitTextToSize(cgvText, contentW);
      const lineHeight = 3.5;

      for (let i = 0; i < cgvLines.length; i++) {
        if (cy + lineHeight > 280) {
          // Footer on CGV page before page break
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(7);
          doc.text(footerParts, pageW / 2, footerY, { align: "center" });
          doc.addPage();
          cy = 25;
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
        }
        doc.text(cgvLines[i], margin, cy);
        cy += lineHeight;
      }

      // Footer on last CGV page
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.text(footerParts, pageW / 2, footerY, { align: "center" });
    }

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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 30, g: 30, b: 30 };
}
