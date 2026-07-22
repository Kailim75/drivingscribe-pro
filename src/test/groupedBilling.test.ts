import { describe, it, expect } from "vitest";
import { isCoveredByFormula, isBillableLesson, isExcludedByDefault, chunk } from "@/lib/groupedBilling";

describe("isCoveredByFormula", () => {
  it("séance liée à un forfait et à 0 € → couverte", () => {
    expect(isCoveredByFormula({ billable_amount: 0, formula_id: "f1", status: "effectue" })).toBe(true);
  });

  it("séance liée à un forfait mais montant saisi manuellement → PAS couverte", () => {
    expect(isCoveredByFormula({ billable_amount: 45, formula_id: "f1", status: "effectue" })).toBe(false);
  });

  it("séance hors forfait à 0 € → pas couverte (juste non facturable)", () => {
    expect(isCoveredByFormula({ billable_amount: 0, formula_id: null, status: "effectue" })).toBe(false);
  });
});

describe("isBillableLesson", () => {
  it("séance hors forfait avec montant → facturable", () => {
    expect(isBillableLesson({ billable_amount: 50, formula_id: null, status: "effectue" })).toBe(true);
  });

  it("séance couverte par forfait → jamais facturable (bug des factures à 0 €)", () => {
    expect(isBillableLesson({ billable_amount: 0, formula_id: "f1", status: "effectue" })).toBe(false);
  });

  it("séance à 0 € sans forfait → pas une ligne de facture", () => {
    expect(isBillableLesson({ billable_amount: 0, formula_id: null, status: "effectue" })).toBe(false);
  });

  it("montant null → pas facturable", () => {
    expect(isBillableLesson({ billable_amount: null, formula_id: null, status: "effectue" })).toBe(false);
  });
});

describe("isExcludedByDefault", () => {
  it("effectuée → cochée par défaut", () => {
    expect(isExcludedByDefault({ billable_amount: 50, status: "effectue" })).toBe(false);
  });

  it("absence facturable → cochée par défaut", () => {
    expect(isExcludedByDefault({ billable_amount: 50, status: "absent" })).toBe(false);
  });

  it("prévue → décochée par défaut (pas encore due)", () => {
    expect(isExcludedByDefault({ billable_amount: 50, status: "prevu" })).toBe(true);
  });

  it("annulée → décochée par défaut (réincluable si annulation tardive)", () => {
    expect(isExcludedByDefault({ billable_amount: 50, status: "annule" })).toBe(true);
  });
});

describe("chunk", () => {
  it("découpe en paquets de la taille demandée", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("liste vide → aucun paquet (aucune requête émise)", () => {
    expect(chunk([], 200)).toEqual([]);
  });

  it("moins d'éléments que la taille → un seul paquet", () => {
    expect(chunk([1], 200)).toEqual([[1]]);
  });
});
