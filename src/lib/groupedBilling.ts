// Règles pures de la facturation groupée — testées dans src/test/groupedBilling.test.ts

export interface BillableLessonInput {
  billable_amount: number | null;
  formula_id?: string | null;
  status: string;
}

/**
 * Séance couverte par un forfait : liée à une formule et valorisée à 0 €.
 * Le trigger DB compute_lesson_billable_amount ne met 0 que pour les offres
 * pack/forfait (heures prépayées, facturées une fois à l'achat) ; une offre
 * « à l'heure » valorise chaque séance au tarif de l'offre de l'élève.
 * Ces séances à 0 € ne doivent JAMAIS devenir des lignes de facture : elles
 * produisaient des factures « vides » pleines de lignes à 0,00 €.
 */
export const isCoveredByFormula = (l: BillableLessonInput): boolean =>
  !!l.formula_id && Number(l.billable_amount ?? 0) <= 0;

/**
 * Ligne facturable : montant strictement positif.
 * (billing_rule = non_facturee est déjà exclue côté requête.)
 */
export const isBillableLesson = (l: BillableLessonInput): boolean =>
  !isCoveredByFormula(l) && Number(l.billable_amount ?? 0) > 0;

/**
 * Cochée par défaut dans la préview ? Seules les séances réellement dues
 * (effectuées, ou absence facturable) le sont. Les séances prévues ou
 * annulées restent visibles mais décochées — réincluables au cas par cas
 * (prépaiement, annulation tardive facturable).
 */
export const isExcludedByDefault = (l: BillableLessonInput): boolean =>
  l.status !== "effectue" && l.status !== "absent";

/** Découpe une liste en paquets (requêtes .in() sans dépasser les limites d'URL). */
export const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};
