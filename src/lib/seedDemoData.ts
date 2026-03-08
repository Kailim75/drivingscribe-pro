import { supabase } from "@/integrations/supabase/client";

// Realistic demo data for a driving school SaaS
export async function seedDemoData(orgId: string, userId: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
  const daysFromNow = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

  // --- INSTRUCTORS ---
  const instructorsData = [
    { first_name: "Marc", last_name: "Dupont", email: "marc.dupont@demo.fr", phone: "06 12 34 56 78", hourly_cost: 25, specialties: ["auto_ecole", "vtc"], status: "actif" as const },
    { first_name: "Sophie", last_name: "Martin", email: "sophie.martin@demo.fr", phone: "06 23 45 67 89", hourly_cost: 28, specialties: ["auto_ecole"], status: "actif" as const },
    { first_name: "Karim", last_name: "Benali", email: "karim.benali@demo.fr", phone: "06 34 56 78 90", hourly_cost: 26, specialties: ["taxi", "vtc"], status: "actif" as const },
  ];

  const { data: instructors } = await supabase
    .from("instructors")
    .insert(instructorsData.map((i) => ({ ...i, organization_id: orgId })))
    .select();

  if (!instructors?.length) throw new Error("Failed to create instructors");

  // --- VEHICLES ---
  const vehiclesData = [
    { brand: "Peugeot", model: "208", plate: "AB-123-CD", category: "auto_ecole", monthly_cost: 450, status: "actif" as const },
    { brand: "Renault", model: "Clio V", plate: "EF-456-GH", category: "auto_ecole", monthly_cost: 420, status: "actif" as const },
    { brand: "Toyota", model: "Yaris", plate: "IJ-789-KL", category: "auto_ecole", monthly_cost: 380, status: "actif" as const },
    { brand: "Mercedes", model: "Classe A", plate: "MN-012-OP", category: "vtc", monthly_cost: 650, status: "actif" as const },
  ];

  const { data: vehicles } = await supabase
    .from("vehicles")
    .insert(vehiclesData.map((v) => ({ ...v, organization_id: orgId })))
    .select();

  if (!vehicles?.length) throw new Error("Failed to create vehicles");

  // --- OFFERS ---
  const offersData = [
    { name: "Heure de conduite", type: "heure" as const, price: 49, hours: 1, tva_rate: 20, deposit_percent: 0, activity_type: "auto_ecole" },
    { name: "Pack 10 heures", type: "pack" as const, price: 440, hours: 10, tva_rate: 20, deposit_percent: 30, activity_type: "auto_ecole" },
    { name: "Pack 20 heures", type: "pack" as const, price: 820, hours: 20, tva_rate: 20, deposit_percent: 30, activity_type: "auto_ecole" },
    { name: "Forfait permis B", type: "forfait" as const, price: 1290, hours: 30, tva_rate: 20, deposit_percent: 50, activity_type: "auto_ecole" },
    { name: "Heure VTC", type: "heure" as const, price: 55, hours: 1, tva_rate: 20, deposit_percent: 0, activity_type: "vtc" },
    { name: "Formation Taxi 5h", type: "pack" as const, price: 320, hours: 5, tva_rate: 20, deposit_percent: 50, activity_type: "taxi" },
  ];

  const { data: offers } = await supabase
    .from("offers")
    .insert(offersData.map((o) => ({ ...o, organization_id: orgId })))
    .select();

  if (!offers?.length) throw new Error("Failed to create offers");

  // --- STUDENTS ---
  const studentsData = [
    { first_name: "Lucas", last_name: "Bernard", email: "lucas.b@mail.com", phone: "07 11 22 33 44", address: "12 rue de la Paix, 75001 Paris", activity_type: "auto_ecole", status: "actif" as const },
    { first_name: "Emma", last_name: "Petit", email: "emma.petit@mail.com", phone: "07 22 33 44 55", address: "8 avenue Victor Hugo, 69002 Lyon", activity_type: "auto_ecole", status: "actif" as const },
    { first_name: "Youssef", last_name: "Kaddour", email: "youssef.k@mail.com", phone: "07 33 44 55 66", address: "45 bd Gambetta, 13001 Marseille", activity_type: "vtc", status: "actif" as const },
    { first_name: "Chloé", last_name: "Moreau", email: "chloe.moreau@mail.com", phone: "07 44 55 66 77", address: "3 place Bellecour, 69002 Lyon", activity_type: "auto_ecole", status: "actif" as const },
    { first_name: "Mehdi", last_name: "Amrani", email: "mehdi.a@mail.com", phone: "07 55 66 77 88", address: "22 rue de la République, 33000 Bordeaux", activity_type: "taxi", status: "actif" as const },
    { first_name: "Léa", last_name: "Durand", email: "lea.durand@mail.com", phone: "07 66 77 88 99", address: "17 rue Pasteur, 44000 Nantes", activity_type: "auto_ecole", status: "en_pause" as const, notes: "Pause examens universitaires, reprend en avril" },
    { first_name: "Thomas", last_name: "Girard", email: "thomas.g@mail.com", phone: "07 77 88 99 00", address: "9 rue du Commerce, 31000 Toulouse", activity_type: "auto_ecole", status: "termine" as const },
    { first_name: "Inès", last_name: "Lefebvre", email: "ines.l@mail.com", phone: "07 88 99 00 11", address: "5 allée des Tilleuls, 67000 Strasbourg", activity_type: "auto_ecole", status: "actif" as const },
  ];

  const { data: students } = await supabase
    .from("students")
    .insert(studentsData.map((s) => ({ ...s, organization_id: orgId })))
    .select();

  if (!students?.length) throw new Error("Failed to create students");

  // --- STUDENT FORMULAS ---
  const formulasData = [
    { student_id: students[0].id, offer_id: offers[3].id, offer_name: "Forfait permis B", offer_type: "forfait" as const, hours_bought: 30, total_price: 1290, active: true },
    { student_id: students[1].id, offer_id: offers[1].id, offer_name: "Pack 10 heures", offer_type: "pack" as const, hours_bought: 10, total_price: 440, active: true },
    { student_id: students[2].id, offer_id: offers[4].id, offer_name: "Heure VTC", offer_type: "heure" as const, hours_bought: 8, total_price: 440, active: true },
    { student_id: students[3].id, offer_id: offers[2].id, offer_name: "Pack 20 heures", offer_type: "pack" as const, hours_bought: 20, total_price: 820, active: true },
    { student_id: students[4].id, offer_id: offers[5].id, offer_name: "Formation Taxi 5h", offer_type: "pack" as const, hours_bought: 5, total_price: 320, active: true },
    { student_id: students[5].id, offer_id: offers[1].id, offer_name: "Pack 10 heures", offer_type: "pack" as const, hours_bought: 10, total_price: 440, active: false },
    { student_id: students[6].id, offer_id: offers[3].id, offer_name: "Forfait permis B", offer_type: "forfait" as const, hours_bought: 30, total_price: 1290, active: false },
    { student_id: students[7].id, offer_id: offers[2].id, offer_name: "Pack 20 heures", offer_type: "pack" as const, hours_bought: 20, total_price: 820, active: true },
    // Lucas bought an additional pack
    { student_id: students[0].id, offer_id: offers[1].id, offer_name: "Pack 10 heures (complément)", offer_type: "pack" as const, hours_bought: 10, total_price: 440, active: true },
  ];

  const { data: formulas } = await supabase
    .from("student_formulas")
    .insert(formulasData.map((f) => ({ ...f, organization_id: orgId })))
    .select();

  if (!formulas?.length) throw new Error("Failed to create formulas");

  // --- LESSONS (past + today + future) ---
  const lessonsData: any[] = [];
  const lessonStatuses = ["effectue", "effectue", "effectue", "effectue", "effectue", "annule", "absent", "effectue"] as const;

  // Past lessons for different students (last 45 days)
  const lessonSlots = [
    { student: 0, instructor: 0, vehicle: 0, daysAgoVal: 42, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 0, vehicle: 0, daysAgoVal: 38, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 1, vehicle: 1, daysAgoVal: 35, start: "10:00", end: "12:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 0, vehicle: 0, daysAgoVal: 30, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 0, vehicle: 0, daysAgoVal: 25, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 1, vehicle: 1, daysAgoVal: 20, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 0, vehicle: 0, daysAgoVal: 15, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 0, vehicle: 0, daysAgoVal: 10, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    { student: 0, instructor: 1, vehicle: 1, daysAgoVal: 5, start: "10:00", end: "12:00", hours: 2, status: "effectue" },
    // Emma
    { student: 1, instructor: 1, vehicle: 1, daysAgoVal: 40, start: "14:00", end: "15:00", hours: 1, status: "effectue" },
    { student: 1, instructor: 1, vehicle: 1, daysAgoVal: 33, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    { student: 1, instructor: 1, vehicle: 1, daysAgoVal: 26, start: "10:00", end: "12:00", hours: 2, status: "annule" },
    { student: 1, instructor: 1, vehicle: 1, daysAgoVal: 19, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    { student: 1, instructor: 1, vehicle: 1, daysAgoVal: 12, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    // Youssef VTC
    { student: 2, instructor: 2, vehicle: 3, daysAgoVal: 37, start: "08:00", end: "10:00", hours: 2, status: "effectue" },
    { student: 2, instructor: 2, vehicle: 3, daysAgoVal: 30, start: "08:00", end: "10:00", hours: 2, status: "effectue" },
    { student: 2, instructor: 2, vehicle: 3, daysAgoVal: 22, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    { student: 2, instructor: 2, vehicle: 3, daysAgoVal: 14, start: "08:00", end: "10:00", hours: 2, status: "absent" },
    // Chloé
    { student: 3, instructor: 0, vehicle: 2, daysAgoVal: 36, start: "16:00", end: "18:00", hours: 2, status: "effectue" },
    { student: 3, instructor: 0, vehicle: 2, daysAgoVal: 29, start: "16:00", end: "18:00", hours: 2, status: "effectue" },
    { student: 3, instructor: 1, vehicle: 2, daysAgoVal: 22, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    { student: 3, instructor: 0, vehicle: 2, daysAgoVal: 15, start: "16:00", end: "18:00", hours: 2, status: "effectue" },
    { student: 3, instructor: 0, vehicle: 2, daysAgoVal: 8, start: "16:00", end: "18:00", hours: 2, status: "effectue" },
    // Mehdi taxi
    { student: 4, instructor: 2, vehicle: 1, daysAgoVal: 28, start: "10:00", end: "11:00", hours: 1, status: "effectue" },
    { student: 4, instructor: 2, vehicle: 1, daysAgoVal: 21, start: "10:00", end: "12:00", hours: 2, status: "effectue" },
    // Inès
    { student: 7, instructor: 1, vehicle: 0, daysAgoVal: 18, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    { student: 7, instructor: 1, vehicle: 0, daysAgoVal: 11, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    { student: 7, instructor: 0, vehicle: 0, daysAgoVal: 4, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
    // Thomas (completed student)
    { student: 6, instructor: 0, vehicle: 0, daysAgoVal: 60, start: "09:00", end: "11:00", hours: 2, status: "effectue" },
    { student: 6, instructor: 0, vehicle: 0, daysAgoVal: 55, start: "14:00", end: "16:00", hours: 2, status: "effectue" },
  ];

  for (const slot of lessonSlots) {
    const formula = formulas.find((f) => f.student_id === students[slot.student].id && f.active);
    lessonsData.push({
      organization_id: orgId,
      student_id: students[slot.student].id,
      instructor_id: instructors[slot.instructor].id,
      vehicle_id: vehicles[slot.vehicle].id,
      date: daysAgo(slot.daysAgoVal),
      start_time: slot.start,
      end_time: slot.end,
      duration_hours: slot.hours,
      status: slot.status,
      billing_rule: slot.status === "annule" ? "totale" : slot.status === "absent" ? "totale" : "totale",
      billable_amount: slot.hours * 49,
      billed_amount: slot.status === "effectue" ? slot.hours * 49 : slot.status === "annule" ? slot.hours * 49 : 0,
      formula_id: formula?.id || null,
    });
  }

  // Today's lessons
  const todaySlots = [
    { student: 0, instructor: 0, vehicle: 0, start: "09:00", end: "11:00", hours: 2, status: "prevu" },
    { student: 3, instructor: 1, vehicle: 2, start: "10:00", end: "12:00", hours: 2, status: "prevu" },
    { student: 7, instructor: 0, vehicle: 1, start: "14:00", end: "16:00", hours: 2, status: "prevu" },
    { student: 2, instructor: 2, vehicle: 3, start: "16:00", end: "18:00", hours: 2, status: "prevu" },
  ];

  for (const slot of todaySlots) {
    const formula = formulas.find((f) => f.student_id === students[slot.student].id && f.active);
    lessonsData.push({
      organization_id: orgId,
      student_id: students[slot.student].id,
      instructor_id: instructors[slot.instructor].id,
      vehicle_id: vehicles[slot.vehicle].id,
      date: fmt(today),
      start_time: slot.start,
      end_time: slot.end,
      duration_hours: slot.hours,
      status: slot.status,
      billing_rule: "totale",
      billable_amount: slot.hours * 49,
      billed_amount: 0,
      formula_id: formula?.id || null,
    });
  }

  // Future lessons
  const futureSlots = [
    { student: 0, instructor: 0, vehicle: 0, daysVal: 2, start: "09:00", end: "11:00", hours: 2 },
    { student: 1, instructor: 1, vehicle: 1, daysVal: 3, start: "14:00", end: "16:00", hours: 2 },
    { student: 3, instructor: 0, vehicle: 2, daysVal: 4, start: "16:00", end: "18:00", hours: 2 },
    { student: 7, instructor: 1, vehicle: 0, daysVal: 5, start: "10:00", end: "12:00", hours: 2 },
    { student: 2, instructor: 2, vehicle: 3, daysVal: 6, start: "08:00", end: "10:00", hours: 2 },
  ];

  for (const slot of futureSlots) {
    const formula = formulas.find((f) => f.student_id === students[slot.student].id && f.active);
    lessonsData.push({
      organization_id: orgId,
      student_id: students[slot.student].id,
      instructor_id: instructors[slot.instructor].id,
      vehicle_id: vehicles[slot.vehicle].id,
      date: daysFromNow(slot.daysVal),
      start_time: slot.start,
      end_time: slot.end,
      duration_hours: slot.hours,
      status: "prevu",
      billing_rule: "totale",
      billable_amount: slot.hours * 49,
      billed_amount: 0,
      formula_id: formula?.id || null,
    });
  }

  await supabase.from("lessons").insert(lessonsData);

  // --- INVOICES ---
  const invoicesData = [
    // Lucas - Forfait payé
    { number: "F-2026-001", type: "facture" as const, student_id: students[0].id, status: "payé" as const, total_ht: 1075, tva_amount: 215, total_ttc: 1290, paid_amount: 1290, remaining_amount: 0, issue_date: daysAgo(40) },
    // Lucas - Pack complémentaire, partiellement payé
    { number: "F-2026-002", type: "facture" as const, student_id: students[0].id, status: "partiellement_payé" as const, total_ht: 366.67, tva_amount: 73.33, total_ttc: 440, paid_amount: 200, remaining_amount: 240, issue_date: daysAgo(20) },
    // Emma - Pack 10h
    { number: "F-2026-003", type: "facture" as const, student_id: students[1].id, status: "payé" as const, total_ht: 366.67, tva_amount: 73.33, total_ttc: 440, paid_amount: 440, remaining_amount: 0, issue_date: daysAgo(38) },
    // Youssef - Heures VTC, en retard
    { number: "F-2026-004", type: "facture" as const, student_id: students[2].id, status: "en_retard" as const, total_ht: 366.67, tva_amount: 73.33, total_ttc: 440, paid_amount: 0, remaining_amount: 440, issue_date: daysAgo(45), due_date: daysAgo(15) },
    // Chloé - Pack 20h
    { number: "F-2026-005", type: "facture" as const, student_id: students[3].id, status: "payé" as const, total_ht: 683.33, tva_amount: 136.67, total_ttc: 820, paid_amount: 820, remaining_amount: 0, issue_date: daysAgo(35) },
    // Mehdi - Taxi
    { number: "F-2026-006", type: "facture" as const, student_id: students[4].id, status: "envoyé" as const, total_ht: 266.67, tva_amount: 53.33, total_ttc: 320, paid_amount: 0, remaining_amount: 320, issue_date: daysAgo(10) },
    // Inès - Pack 20h, brouillon
    { number: "D-2026-001", type: "devis" as const, student_id: students[7].id, status: "brouillon" as const, total_ht: 683.33, tva_amount: 136.67, total_ttc: 820, paid_amount: 0, remaining_amount: 820, issue_date: daysAgo(5) },
    // Inès - Pack converti
    { number: "F-2026-007", type: "facture" as const, student_id: students[7].id, status: "partiellement_payé" as const, total_ht: 683.33, tva_amount: 136.67, total_ttc: 820, paid_amount: 410, remaining_amount: 410, issue_date: daysAgo(3) },
  ];

  const { data: invoices } = await supabase
    .from("invoices")
    .insert(invoicesData.map((i) => ({ ...i, organization_id: orgId })))
    .select();

  if (!invoices?.length) throw new Error("Failed to create invoices");

  // --- INVOICE LINES ---
  const linesData = invoices.flatMap((inv) => {
    const student = studentsData.find((_, i) => students[i]?.id === inv.student_id);
    return [{ invoice_id: inv.id, description: `Formation - ${inv.number}`, quantity: 1, unit_price: inv.total_ht, total_ht: inv.total_ht }];
  });

  await supabase.from("invoice_lines").insert(linesData);

  // --- PAYMENTS ---
  const paymentsData = [
    { student_id: students[0].id, invoice_id: invoices[0].id, amount: 1290, method: "carte" as const, date: daysAgo(40), reference: "CB-001" },
    { student_id: students[0].id, invoice_id: invoices[1].id, amount: 200, method: "virement" as const, date: daysAgo(18), reference: "VIR-002" },
    { student_id: students[1].id, invoice_id: invoices[2].id, amount: 440, method: "carte" as const, date: daysAgo(37), reference: "CB-003" },
    { student_id: students[3].id, invoice_id: invoices[4].id, amount: 400, method: "chèque" as const, date: daysAgo(34), reference: "CHQ-004" },
    { student_id: students[3].id, invoice_id: invoices[4].id, amount: 420, method: "espèces" as const, date: daysAgo(20), reference: "ESP-005" },
    { student_id: students[7].id, invoice_id: invoices[7].id, amount: 410, method: "carte" as const, date: daysAgo(2), reference: "CB-006" },
  ];

  await supabase.from("payments").insert(paymentsData.map((p) => ({ ...p, organization_id: orgId })));

  // --- EXPENSES ---
  const expensesData = [
    { category: "Carburant", description: "Plein Peugeot 208", amount: 65, type: "directe" as const, date: daysAgo(3), vehicle_id: vehicles[0].id },
    { category: "Carburant", description: "Plein Renault Clio", amount: 58, type: "directe" as const, date: daysAgo(7), vehicle_id: vehicles[1].id },
    { category: "Carburant", description: "Plein Toyota Yaris", amount: 52, type: "directe" as const, date: daysAgo(12), vehicle_id: vehicles[2].id },
    { category: "Carburant", description: "Plein Mercedes Classe A", amount: 72, type: "directe" as const, date: daysAgo(5), vehicle_id: vehicles[3].id },
    { category: "Entretien", description: "Révision 208 - 60 000 km", amount: 320, type: "directe" as const, date: daysAgo(25), vehicle_id: vehicles[0].id },
    { category: "Assurance", description: "Assurance flotte mensuelle", amount: 480, type: "fixe" as const, date: daysAgo(1), recurring: true, recurring_period: "mensuel" },
    { category: "Loyer", description: "Loyer bureau + salle", amount: 850, type: "fixe" as const, date: daysAgo(1), recurring: true, recurring_period: "mensuel" },
    { category: "Logiciel", description: "Abonnement gestion", amount: 49, type: "fixe" as const, date: daysAgo(1), recurring: true, recurring_period: "mensuel" },
    { category: "Administratif", description: "Fournitures bureau", amount: 35, type: "fixe" as const, date: daysAgo(15) },
    { category: "Rémunération", description: "Salaire Marc Dupont", amount: 2200, type: "directe" as const, date: daysAgo(1), instructor_id: instructors[0].id, recurring: true, recurring_period: "mensuel" },
    { category: "Rémunération", description: "Salaire Sophie Martin", amount: 2400, type: "directe" as const, date: daysAgo(1), instructor_id: instructors[1].id, recurring: true, recurring_period: "mensuel" },
    { category: "Rémunération", description: "Salaire Karim Benali", amount: 2100, type: "directe" as const, date: daysAgo(1), instructor_id: instructors[2].id, recurring: true, recurring_period: "mensuel" },
  ];

  await supabase.from("expenses").insert(expensesData.map((e) => ({ ...e, organization_id: orgId })));

  // --- REMINDERS ---
  const remindersData = [
    { type: "impayé" as const, student_id: students[2].id, invoice_id: invoices[3].id, message: "Bonjour Youssef, votre facture F-2026-004 de 440 € est en retard de paiement. Merci de régulariser.", status: "planifié" as const, channel: "email" as const, scheduled_at: new Date().toISOString() },
    { type: "séance" as const, student_id: students[0].id, message: "Rappel : votre séance de conduite est prévue demain à 9h00.", status: "envoyé" as const, channel: "email" as const, scheduled_at: new Date(Date.now() - 86400000).toISOString(), sent_at: new Date(Date.now() - 86400000).toISOString() },
    { type: "séance" as const, student_id: students[3].id, message: "Rappel : séance prévue demain à 10h00 avec Sophie Martin.", status: "envoyé" as const, channel: "email" as const, scheduled_at: new Date(Date.now() - 86400000).toISOString(), sent_at: new Date(Date.now() - 86400000).toISOString() },
    { type: "impayé" as const, student_id: students[0].id, invoice_id: invoices[1].id, message: "Bonjour Lucas, il reste 240 € à régler sur votre facture F-2026-002.", status: "planifié" as const, channel: "email" as const, scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString() },
  ];

  await supabase.from("reminders").insert(remindersData.map((r) => ({ ...r, organization_id: orgId })));

  // --- AUDIT LOG ---
  await supabase.from("audit_logs").insert({
    organization_id: orgId,
    user_id: userId,
    action: "Données de démonstration chargées",
    entity: "organization",
    entity_id: orgId,
    details: "8 élèves, 3 formateurs, 4 véhicules, 6 offres, 39 séances, 8 factures, 6 paiements, 12 dépenses",
  });

  // Update org invoice/quote counters
  await supabase.from("organizations").update({ invoice_next_number: 8, quote_next_number: 2 }).eq("id", orgId);
}
