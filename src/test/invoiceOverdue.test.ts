import { describe, it, expect } from "vitest";
import { isInvoiceOverdue, invoiceDisplayStatus } from "@/lib/labels";

const TODAY = "2026-07-18";

const base = {
  type: "facture",
  status: "envoyé",
  due_date: "2026-07-01",
  remaining_amount: 100,
};

describe("isInvoiceOverdue", () => {
  it("facture échue avec reste dû → en retard", () => {
    expect(isInvoiceOverdue(base, TODAY)).toBe(true);
  });

  it("facture non échue → pas en retard", () => {
    expect(isInvoiceOverdue({ ...base, due_date: "2026-08-01" }, TODAY)).toBe(false);
  });

  it("échéance le jour même → pas encore en retard", () => {
    expect(isInvoiceOverdue({ ...base, due_date: TODAY }, TODAY)).toBe(false);
  });

  it("facture soldée → jamais en retard, même échue", () => {
    expect(isInvoiceOverdue({ ...base, remaining_amount: 0 }, TODAY)).toBe(false);
  });

  it("brouillon échu → pas en retard (non émis)", () => {
    expect(isInvoiceOverdue({ ...base, status: "brouillon" }, TODAY)).toBe(false);
  });

  it("statuts terminaux (payé/annulé/archivé) → pas en retard", () => {
    for (const status of ["payé", "annulé", "archivé"]) {
      expect(isInvoiceOverdue({ ...base, status }, TODAY)).toBe(false);
    }
  });

  it("devis échu → pas en retard (seules les factures le sont)", () => {
    expect(isInvoiceOverdue({ ...base, type: "devis" }, TODAY)).toBe(false);
  });

  it("statut en_retard hérité avec reste dû → conservé même si l'échéance est future", () => {
    expect(isInvoiceOverdue({ ...base, status: "en_retard", due_date: "2026-08-01" }, TODAY)).toBe(true);
  });

  it("statut en_retard hérité mais soldée → plus en retard", () => {
    expect(isInvoiceOverdue({ ...base, status: "en_retard", remaining_amount: 0 }, TODAY)).toBe(false);
  });
});

describe("invoiceDisplayStatus", () => {
  it("facture échue affichée en_retard quel que soit le statut stocké", () => {
    expect(invoiceDisplayStatus({ ...base })).toBe(
      base.due_date < new Date().toISOString().split("T")[0] ? "en_retard" : base.status
    );
  });

  it("facture payée garde son statut", () => {
    expect(invoiceDisplayStatus({ ...base, status: "payé", remaining_amount: 0 })).toBe("payé");
  });
});
