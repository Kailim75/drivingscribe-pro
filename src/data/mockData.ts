// Centralized mock data — single source of truth for all modules
// All data is cross-referenced by IDs for consistency

export type ActivityType = "auto-école" | "taxi" | "vtc" | "vmdtr";
export type StudentStatus = "actif" | "en_pause" | "terminé" | "archivé";
export type InstructorStatus = "actif" | "inactif" | "archivé";
export type VehicleStatus = "actif" | "indisponible" | "maintenance" | "archivé";
export type LessonStatus = "prévu" | "effectué" | "annulé" | "absent";
export type BillingRule = "totale" | "partielle" | "non_facturée";
export type OfferType = "heure" | "pack" | "forfait";
export type InvoiceStatus = "brouillon" | "envoyé" | "partiellement_payé" | "payé" | "en_retard" | "annulé";
export type PaymentMethod = "espèces" | "virement" | "carte" | "chèque";
export type ExpenseType = "directe" | "fixe";
export type ReminderType = "séance" | "impayé" | "document" | "autre";
export type ReminderChannel = "email" | "sms" | "whatsapp";
export type UserRole = "owner" | "admin" | "instructor" | "accountant";

export interface Organization {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  siret: string;
  tvaNumber: string;
  tvaRate: number;
  invoicePrefix: string;
  quotePrefix: string;
  mode: "independant" | "centre";
}

export interface Instructor {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: InstructorStatus;
  hourlyCost: number;
  role: UserRole;
  specialties: ActivityType[];
  notes: string;
}

export interface Vehicle {
  id: string;
  organizationId: string;
  plate: string;
  model: string;
  brand: string;
  category: ActivityType;
  status: VehicleStatus;
  monthlyCost: number;
  notes: string;
}

export interface Student {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  activityType: ActivityType;
  status: StudentStatus;
  notes: string;
  createdAt: string;
}

export interface StudentFormula {
  id: string;
  studentId: string;
  offerId: string;
  offerName: string;
  offerType: OfferType;
  hoursBought: number;
  hoursDone: number;
  hoursRemaining: number;
  totalPrice: number;
  active: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  organizationId: string;
  name: string;
  type: OfferType;
  price: number;
  hours: number | null;
  tvaRate: number;
  depositPercent: number;
  cancellationPolicy: string;
  activityType: ActivityType;
  active: boolean;
}

export interface Lesson {
  id: string;
  organizationId: string;
  studentId: string;
  instructorId: string;
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: LessonStatus;
  billingRule: BillingRule;
  billableAmount: number;
  billedAmount: number;
  note: string;
  formulaId: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  number: string;
  studentId: string;
  status: InvoiceStatus;
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
  paidAmount: number;
  remainingAmount: number;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
}

export interface Payment {
  id: string;
  organizationId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference: string;
  notes: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  category: string;
  description: string;
  amount: number;
  type: ExpenseType;
  date: string;
  recurring: boolean;
  recurringPeriod?: "mensuel" | "trimestriel" | "annuel";
  vehicleId?: string;
  instructorId?: string;
}

export interface Reminder {
  id: string;
  organizationId: string;
  type: ReminderType;
  channel: ReminderChannel;
  studentId?: string;
  invoiceId?: string;
  message: string;
  scheduledAt: string;
  sentAt?: string;
  status: "planifié" | "envoyé" | "échoué";
}

export interface Document {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  studentId?: string;
  invoiceId?: string;
  size: string;
  uploadedAt: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

// ========================================
// MOCK DATA
// ========================================

export const organization: Organization = {
  id: "org-1",
  name: "Auto-École Centrale",
  address: "12 rue de la République, 75003 Paris",
  phone: "01 42 33 44 55",
  email: "contact@ae-centrale.fr",
  siret: "123 456 789 00012",
  tvaNumber: "FR 12 345678901",
  tvaRate: 20,
  invoicePrefix: "F",
  quotePrefix: "D",
  mode: "centre",
};

export const instructors: Instructor[] = [
  { id: "inst-1", organizationId: "org-1", firstName: "Jean-Marc", lastName: "Duval", phone: "06 11 22 33 44", email: "jm.duval@ae-centrale.fr", status: "actif", hourlyCost: 35, role: "instructor", specialties: ["auto-école", "taxi"], notes: "Formateur principal, 12 ans d'expérience" },
  { id: "inst-2", organizationId: "org-1", firstName: "Fatima", lastName: "Benali", phone: "06 22 33 44 55", email: "f.benali@ae-centrale.fr", status: "actif", hourlyCost: 32, role: "instructor", specialties: ["auto-école"], notes: "Spécialiste conduite accompagnée" },
  { id: "inst-3", organizationId: "org-1", firstName: "Pierre", lastName: "Moreau", phone: "06 33 44 55 66", email: "p.moreau@ae-centrale.fr", status: "actif", hourlyCost: 38, role: "instructor", specialties: ["vtc", "vmdtr"], notes: "Expert VTC et VMDTR" },
];

export const vehicles: Vehicle[] = [
  { id: "veh-1", organizationId: "org-1", plate: "AB-123-CD", model: "208", brand: "Peugeot", category: "auto-école", status: "actif", monthlyCost: 450, notes: "Double commande installée" },
  { id: "veh-2", organizationId: "org-1", plate: "EF-456-GH", model: "Clio V", brand: "Renault", category: "auto-école", status: "actif", monthlyCost: 420, notes: "Boîte automatique" },
  { id: "veh-3", organizationId: "org-1", plate: "IJ-789-KL", model: "Model 3", brand: "Tesla", category: "vtc", status: "actif", monthlyCost: 680, notes: "Véhicule VTC premium" },
  { id: "veh-4", organizationId: "org-1", plate: "MN-012-OP", model: "Sandero", brand: "Dacia", category: "auto-école", status: "maintenance", monthlyCost: 350, notes: "En révision — retour prévu le 15/03" },
];

export const students: Student[] = [
  { id: "stu-1", organizationId: "org-1", firstName: "Marie", lastName: "Dupont", phone: "06 12 34 56 78", email: "marie.dupont@email.com", address: "5 rue des Lilas, 75011 Paris", activityType: "auto-école", status: "actif", notes: "Élève motivée, bon niveau", createdAt: "2024-09-15" },
  { id: "stu-2", organizationId: "org-1", firstName: "Karim", lastName: "Bensaid", phone: "06 23 45 67 89", email: "karim.b@email.com", address: "18 bd Voltaire, 75011 Paris", activityType: "taxi", status: "actif", notes: "Formation taxi — reste peu d'heures", createdAt: "2024-08-01" },
  { id: "stu-3", organizationId: "org-1", firstName: "Sophie", lastName: "Martin", phone: "06 34 56 78 90", email: "sophie.martin@email.com", address: "22 rue Oberkampf, 75011 Paris", activityType: "auto-école", status: "en_pause", notes: "En pause pour raisons personnelles — facture impayée", createdAt: "2024-07-20" },
  { id: "stu-4", organizationId: "org-1", firstName: "Lucas", lastName: "Petit", phone: "06 45 67 89 01", email: "lucas.petit@email.com", address: "8 rue de Ménilmontant, 75020 Paris", activityType: "vtc", status: "actif", notes: "Formation VTC en cours", createdAt: "2024-10-01" },
  { id: "stu-5", organizationId: "org-1", firstName: "Amina", lastName: "Youssef", phone: "06 56 78 90 12", email: "amina.y@email.com", address: "15 rue de Belleville, 75019 Paris", activityType: "vmdtr", status: "actif", notes: "", createdAt: "2024-11-10" },
  { id: "stu-6", organizationId: "org-1", firstName: "Thomas", lastName: "Bernard", phone: "06 67 89 01 23", email: "thomas.b@email.com", address: "3 place de la Nation, 75012 Paris", activityType: "auto-école", status: "terminé", notes: "Permis obtenu le 20/01/2025", createdAt: "2024-06-01" },
  { id: "stu-7", organizationId: "org-1", firstName: "Julie", lastName: "Lefebvre", phone: "06 78 90 12 34", email: "julie.l@email.com", address: "42 rue de Charonne, 75011 Paris", activityType: "auto-école", status: "actif", notes: "Début de formation", createdAt: "2025-01-05" },
  { id: "stu-8", organizationId: "org-1", firstName: "Mehdi", lastName: "Alaoui", phone: "06 89 01 23 45", email: "mehdi.a@email.com", address: "7 rue du Faubourg Saint-Antoine, 75011 Paris", activityType: "taxi", status: "actif", notes: "Forfait complet taxi", createdAt: "2024-11-20" },
];

export const studentFormulas: StudentFormula[] = [
  { id: "sf-1", studentId: "stu-1", offerId: "off-3", offerName: "Pack 30h Auto-école", offerType: "pack", hoursBought: 30, hoursDone: 18, hoursRemaining: 12, totalPrice: 1200, active: true, createdAt: "2024-09-15" },
  { id: "sf-2", studentId: "stu-2", offerId: "off-6", offerName: "Pack 20h Taxi", offerType: "pack", hoursBought: 20, hoursDone: 18, hoursRemaining: 2, totalPrice: 1000, active: true, createdAt: "2024-08-01" },
  { id: "sf-3", studentId: "stu-3", offerId: "off-4", offerName: "Forfait B complet", offerType: "forfait", hoursBought: 25, hoursDone: 10, hoursRemaining: 15, totalPrice: 1500, active: true, createdAt: "2024-07-20" },
  { id: "sf-4", studentId: "stu-4", offerId: "off-7", offerName: "Forfait VTC complet", offerType: "forfait", hoursBought: 40, hoursDone: 32, hoursRemaining: 8, totalPrice: 2200, active: true, createdAt: "2024-10-01" },
  { id: "sf-5", studentId: "stu-5", offerId: "off-5", offerName: "Heure VMDTR", offerType: "heure", hoursBought: 15, hoursDone: 5, hoursRemaining: 10, totalPrice: 825, active: true, createdAt: "2024-11-10" },
  { id: "sf-6", studentId: "stu-6", offerId: "off-4", offerName: "Forfait B complet", offerType: "forfait", hoursBought: 30, hoursDone: 30, hoursRemaining: 0, totalPrice: 1500, active: false, createdAt: "2024-06-01" },
  { id: "sf-7", studentId: "stu-7", offerId: "off-2", offerName: "Pack 20h Auto-école", offerType: "pack", hoursBought: 20, hoursDone: 3, hoursRemaining: 17, totalPrice: 850, active: true, createdAt: "2025-01-05" },
  { id: "sf-8", studentId: "stu-8", offerId: "off-8", offerName: "Forfait Taxi complet", offerType: "forfait", hoursBought: 35, hoursDone: 12, hoursRemaining: 23, totalPrice: 1900, active: true, createdAt: "2024-11-20" },
];

export const offers: Offer[] = [
  { id: "off-1", organizationId: "org-1", name: "Heure individuelle", type: "heure", price: 45, hours: 1, tvaRate: 20, depositPercent: 0, cancellationPolicy: "Annulation 48h avant sans frais", activityType: "auto-école", active: true },
  { id: "off-2", organizationId: "org-1", name: "Pack 20h Auto-école", type: "pack", price: 850, hours: 20, tvaRate: 20, depositPercent: 30, cancellationPolicy: "Non remboursable après début", activityType: "auto-école", active: true },
  { id: "off-3", organizationId: "org-1", name: "Pack 30h Auto-école", type: "pack", price: 1200, hours: 30, tvaRate: 20, depositPercent: 30, cancellationPolicy: "Non remboursable après début", activityType: "auto-école", active: true },
  { id: "off-4", organizationId: "org-1", name: "Forfait B complet", type: "forfait", price: 1500, hours: 25, tvaRate: 20, depositPercent: 30, cancellationPolicy: "Conditions forfait", activityType: "auto-école", active: true },
  { id: "off-5", organizationId: "org-1", name: "Heure VMDTR", type: "heure", price: 55, hours: 1, tvaRate: 20, depositPercent: 0, cancellationPolicy: "Annulation 48h avant sans frais", activityType: "vmdtr", active: true },
  { id: "off-6", organizationId: "org-1", name: "Pack 20h Taxi", type: "pack", price: 1000, hours: 20, tvaRate: 20, depositPercent: 30, cancellationPolicy: "Non remboursable après début", activityType: "taxi", active: true },
  { id: "off-7", organizationId: "org-1", name: "Forfait VTC complet", type: "forfait", price: 2200, hours: 40, tvaRate: 20, depositPercent: 30, cancellationPolicy: "Conditions forfait", activityType: "vtc", active: true },
  { id: "off-8", organizationId: "org-1", name: "Forfait Taxi complet", type: "forfait", price: 1900, hours: 35, tvaRate: 20, depositPercent: 30, cancellationPolicy: "Conditions forfait", activityType: "taxi", active: false },
];

// Today-relative dates
const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const lessons: Lesson[] = [
  // Today
  { id: "les-1", organizationId: "org-1", studentId: "stu-1", instructorId: "inst-1", vehicleId: "veh-1", date: fmt(today), startTime: "09:00", endTime: "10:00", durationHours: 1, status: "effectué", billingRule: "totale", billableAmount: 40, billedAmount: 40, note: "Bonne maîtrise des créneaux", formulaId: "sf-1" },
  { id: "les-2", organizationId: "org-1", studentId: "stu-2", instructorId: "inst-1", vehicleId: "veh-2", date: fmt(today), startTime: "10:30", endTime: "12:30", durationHours: 2, status: "prévu", billingRule: "totale", billableAmount: 100, billedAmount: 0, note: "", formulaId: "sf-2" },
  { id: "les-3", organizationId: "org-1", studentId: "stu-4", instructorId: "inst-3", vehicleId: "veh-3", date: fmt(today), startTime: "14:00", endTime: "15:30", durationHours: 1.5, status: "prévu", billingRule: "totale", billableAmount: 82.5, billedAmount: 0, note: "", formulaId: "sf-4" },
  { id: "les-4", organizationId: "org-1", studentId: "stu-5", instructorId: "inst-3", vehicleId: "veh-3", date: fmt(today), startTime: "16:00", endTime: "18:00", durationHours: 2, status: "prévu", billingRule: "totale", billableAmount: 110, billedAmount: 0, note: "", formulaId: "sf-5" },
  { id: "les-5", organizationId: "org-1", studentId: "stu-7", instructorId: "inst-2", vehicleId: "veh-1", date: fmt(today), startTime: "09:00", endTime: "10:00", durationHours: 1, status: "effectué", billingRule: "totale", billableAmount: 42.5, billedAmount: 42.5, note: "Première séance, prise en main", formulaId: "sf-7" },
  // Tomorrow
  { id: "les-6", organizationId: "org-1", studentId: "stu-1", instructorId: "inst-2", vehicleId: "veh-2", date: fmt(addDays(today, 1)), startTime: "10:00", endTime: "11:00", durationHours: 1, status: "prévu", billingRule: "totale", billableAmount: 40, billedAmount: 0, note: "", formulaId: "sf-1" },
  { id: "les-7", organizationId: "org-1", studentId: "stu-8", instructorId: "inst-1", vehicleId: "veh-2", date: fmt(addDays(today, 1)), startTime: "14:00", endTime: "16:00", durationHours: 2, status: "prévu", billingRule: "totale", billableAmount: 108.57, billedAmount: 0, note: "", formulaId: "sf-8" },
  // Past - cancelled
  { id: "les-8", organizationId: "org-1", studentId: "stu-3", instructorId: "inst-2", vehicleId: "veh-1", date: fmt(addDays(today, -3)), startTime: "11:00", endTime: "12:00", durationHours: 1, status: "annulé", billingRule: "totale", billableAmount: 60, billedAmount: 60, note: "Annulé sans préavis — facturé", formulaId: "sf-3" },
  // Past - absent
  { id: "les-9", organizationId: "org-1", studentId: "stu-2", instructorId: "inst-1", vehicleId: "veh-2", date: fmt(addDays(today, -1)), startTime: "09:00", endTime: "11:00", durationHours: 2, status: "absent", billingRule: "totale", billableAmount: 100, billedAmount: 100, note: "Absent sans prévenir", formulaId: "sf-2" },
  // Past completed
  { id: "les-10", organizationId: "org-1", studentId: "stu-4", instructorId: "inst-3", vehicleId: "veh-3", date: fmt(addDays(today, -2)), startTime: "14:00", endTime: "16:00", durationHours: 2, status: "effectué", billingRule: "totale", billableAmount: 110, billedAmount: 110, note: "Bon parcours autoroute", formulaId: "sf-4" },
];

export const invoices: Invoice[] = [
  {
    id: "inv-1", organizationId: "org-1", number: "F-2025-001", studentId: "stu-1", status: "payé",
    totalHT: 1000, tvaAmount: 200, totalTTC: 1200, paidAmount: 1200, remainingAmount: 0,
    issueDate: "2024-09-20", dueDate: "2024-10-20",
    items: [{ id: "ii-1", description: "Pack 30h Auto-école", quantity: 1, unitPrice: 1000, totalHT: 1000 }],
  },
  {
    id: "inv-2", organizationId: "org-1", number: "F-2025-002", studentId: "stu-2", status: "partiellement_payé",
    totalHT: 833.33, tvaAmount: 166.67, totalTTC: 1000, paidAmount: 700, remainingAmount: 300,
    issueDate: "2024-08-10", dueDate: "2024-09-10",
    items: [{ id: "ii-2", description: "Pack 20h Taxi", quantity: 1, unitPrice: 833.33, totalHT: 833.33 }],
  },
  {
    id: "inv-3", organizationId: "org-1", number: "F-2025-003", studentId: "stu-3", status: "en_retard",
    totalHT: 1250, tvaAmount: 250, totalTTC: 1500, paidAmount: 450, remainingAmount: 1050,
    issueDate: "2024-08-01", dueDate: "2024-09-01",
    items: [{ id: "ii-3", description: "Forfait B complet", quantity: 1, unitPrice: 1250, totalHT: 1250 }],
  },
  {
    id: "inv-4", organizationId: "org-1", number: "F-2025-004", studentId: "stu-4", status: "payé",
    totalHT: 1833.33, tvaAmount: 366.67, totalTTC: 2200, paidAmount: 2200, remainingAmount: 0,
    issueDate: "2024-10-05", dueDate: "2024-11-05",
    items: [{ id: "ii-4", description: "Forfait VTC complet", quantity: 1, unitPrice: 1833.33, totalHT: 1833.33 }],
  },
  {
    id: "inv-5", organizationId: "org-1", number: "F-2025-005", studentId: "stu-7", status: "envoyé",
    totalHT: 708.33, tvaAmount: 141.67, totalTTC: 850, paidAmount: 255, remainingAmount: 595,
    issueDate: "2025-01-10", dueDate: "2025-02-10",
    items: [{ id: "ii-5", description: "Pack 20h Auto-école", quantity: 1, unitPrice: 708.33, totalHT: 708.33 }],
  },
  {
    id: "inv-6", organizationId: "org-1", number: "F-2025-006", studentId: "stu-8", status: "partiellement_payé",
    totalHT: 1583.33, tvaAmount: 316.67, totalTTC: 1900, paidAmount: 570, remainingAmount: 1330,
    issueDate: "2024-12-01", dueDate: "2025-01-01",
    items: [{ id: "ii-6", description: "Forfait Taxi complet", quantity: 1, unitPrice: 1583.33, totalHT: 1583.33 }],
  },
];

export const payments: Payment[] = [
  { id: "pay-1", organizationId: "org-1", invoiceId: "inv-1", studentId: "stu-1", amount: 360, method: "carte", date: "2024-09-20", reference: "CB-2024-001", notes: "Acompte 30%" },
  { id: "pay-2", organizationId: "org-1", invoiceId: "inv-1", studentId: "stu-1", amount: 840, method: "virement", date: "2024-10-15", reference: "VIR-2024-002", notes: "Solde" },
  { id: "pay-3", organizationId: "org-1", invoiceId: "inv-2", studentId: "stu-2", amount: 300, method: "carte", date: "2024-08-10", reference: "CB-2024-003", notes: "Acompte" },
  { id: "pay-4", organizationId: "org-1", invoiceId: "inv-2", studentId: "stu-2", amount: 400, method: "espèces", date: "2024-09-20", reference: "ESP-2024-004", notes: "" },
  { id: "pay-5", organizationId: "org-1", invoiceId: "inv-3", studentId: "stu-3", amount: 450, method: "carte", date: "2024-08-01", reference: "CB-2024-005", notes: "Acompte — reste impayé" },
  { id: "pay-6", organizationId: "org-1", invoiceId: "inv-4", studentId: "stu-4", amount: 660, method: "carte", date: "2024-10-05", reference: "CB-2024-006", notes: "Acompte 30%" },
  { id: "pay-7", organizationId: "org-1", invoiceId: "inv-4", studentId: "stu-4", amount: 1540, method: "virement", date: "2024-11-01", reference: "VIR-2024-007", notes: "Solde" },
  { id: "pay-8", organizationId: "org-1", invoiceId: "inv-5", studentId: "stu-7", amount: 255, method: "carte", date: "2025-01-10", reference: "CB-2025-001", notes: "Acompte 30%" },
  { id: "pay-9", organizationId: "org-1", invoiceId: "inv-6", studentId: "stu-8", amount: 570, method: "virement", date: "2024-12-01", reference: "VIR-2024-008", notes: "Acompte 30%" },
];

export const expenses: Expense[] = [
  { id: "exp-1", organizationId: "org-1", category: "Véhicule", description: "Leasing Peugeot 208", amount: 450, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel", vehicleId: "veh-1" },
  { id: "exp-2", organizationId: "org-1", category: "Véhicule", description: "Leasing Renault Clio V", amount: 420, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel", vehicleId: "veh-2" },
  { id: "exp-3", organizationId: "org-1", category: "Véhicule", description: "Leasing Tesla Model 3", amount: 680, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel", vehicleId: "veh-3" },
  { id: "exp-4", organizationId: "org-1", category: "Véhicule", description: "Leasing Dacia Sandero", amount: 350, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel", vehicleId: "veh-4" },
  { id: "exp-5", organizationId: "org-1", category: "Carburant", description: "Carburant mars", amount: 380, type: "directe", date: "2025-03-05", recurring: false },
  { id: "exp-6", organizationId: "org-1", category: "Assurance", description: "Assurance flotte véhicules", amount: 620, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel" },
  { id: "exp-7", organizationId: "org-1", category: "Loyer", description: "Loyer bureau", amount: 1200, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel" },
  { id: "exp-8", organizationId: "org-1", category: "Entretien", description: "Révision Sandero", amount: 285, type: "directe", date: "2025-03-04", recurring: false, vehicleId: "veh-4" },
  { id: "exp-9", organizationId: "org-1", category: "Salaire", description: "Salaire Jean-Marc Duval", amount: 2800, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel", instructorId: "inst-1" },
  { id: "exp-10", organizationId: "org-1", category: "Salaire", description: "Salaire Fatima Benali", amount: 2500, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel", instructorId: "inst-2" },
  { id: "exp-11", organizationId: "org-1", category: "Salaire", description: "Salaire Pierre Moreau", amount: 3000, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel", instructorId: "inst-3" },
  { id: "exp-12", organizationId: "org-1", category: "Logiciel", description: "Abonnement logiciel planning", amount: 49, type: "fixe", date: "2025-03-01", recurring: true, recurringPeriod: "mensuel" },
];

export const reminders: Reminder[] = [
  { id: "rem-1", organizationId: "org-1", type: "séance", channel: "email", studentId: "stu-2", message: "Rappel : votre séance demain à 10h30", scheduledAt: fmt(today), sentAt: fmt(today), status: "envoyé" },
  { id: "rem-2", organizationId: "org-1", type: "impayé", channel: "email", studentId: "stu-3", invoiceId: "inv-3", message: "Relance : facture F-2025-003 en retard — 1 050 € restants", scheduledAt: fmt(addDays(today, -5)), sentAt: fmt(addDays(today, -5)), status: "envoyé" },
  { id: "rem-3", organizationId: "org-1", type: "impayé", channel: "email", studentId: "stu-3", invoiceId: "inv-3", message: "2e relance : facture F-2025-003 — merci de régulariser", scheduledAt: fmt(addDays(today, 2)), status: "planifié" },
  { id: "rem-4", organizationId: "org-1", type: "séance", channel: "email", studentId: "stu-4", message: "Rappel : séance VTC demain à 14h", scheduledAt: fmt(today), status: "planifié" },
  { id: "rem-5", organizationId: "org-1", type: "document", channel: "email", studentId: "stu-5", message: "Merci de transmettre votre pièce d'identité", scheduledAt: fmt(addDays(today, -10)), sentAt: fmt(addDays(today, -10)), status: "envoyé" },
];

export const documents: Document[] = [
  { id: "doc-1", organizationId: "org-1", name: "CNI Marie Dupont.pdf", type: "Identité", studentId: "stu-1", size: "1.2 Mo", uploadedAt: "2024-09-15", notes: "" },
  { id: "doc-2", organizationId: "org-1", name: "Attestation CERFA Karim.pdf", type: "CERFA", studentId: "stu-2", size: "850 Ko", uploadedAt: "2024-08-01", notes: "Attestation complète" },
  { id: "doc-3", organizationId: "org-1", name: "Facture F-2025-001.pdf", type: "Facture", invoiceId: "inv-1", size: "420 Ko", uploadedAt: "2024-09-20", notes: "" },
  { id: "doc-4", organizationId: "org-1", name: "Assurance flotte 2025.pdf", type: "Assurance", size: "2.1 Mo", uploadedAt: "2025-01-15", notes: "Renouvellement annuel" },
  { id: "doc-5", organizationId: "org-1", name: "Photo permis Lucas.jpg", type: "Identité", studentId: "stu-4", size: "3.4 Mo", uploadedAt: "2024-10-01", notes: "" },
];

export const auditLogs: AuditLog[] = [
  { id: "log-1", organizationId: "org-1", userId: "inst-1", userName: "Jean-Marc Duval", action: "Séance effectuée", entity: "lesson", entityId: "les-1", details: "Marie Dupont — 09:00-10:00", timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 5).toISOString() },
  { id: "log-2", organizationId: "org-1", userId: "inst-2", userName: "Fatima Benali", action: "Séance effectuée", entity: "lesson", entityId: "les-5", details: "Julie Lefebvre — 09:00-10:00", timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 10).toISOString() },
  { id: "log-3", organizationId: "org-1", userId: "admin", userName: "Admin", action: "Paiement enregistré", entity: "payment", entityId: "pay-8", details: "Julie Lefebvre — 255 € (acompte)", timestamp: "2025-01-10T14:30:00Z" },
  { id: "log-4", organizationId: "org-1", userId: "admin", userName: "Admin", action: "Facture créée", entity: "invoice", entityId: "inv-5", details: "F-2025-005 — Julie Lefebvre — 850 €", timestamp: "2025-01-10T14:00:00Z" },
  { id: "log-5", organizationId: "org-1", userId: "admin", userName: "Admin", action: "Relance envoyée", entity: "reminder", entityId: "rem-2", details: "Sophie Martin — F-2025-003 — 1 050 €", timestamp: addDays(today, -5).toISOString() },
  { id: "log-6", organizationId: "org-1", userId: "inst-1", userName: "Jean-Marc Duval", action: "Séance annulée", entity: "lesson", entityId: "les-8", details: "Sophie Martin — annulé sans préavis", timestamp: addDays(today, -3).toISOString() },
  { id: "log-7", organizationId: "org-1", userId: "admin", userName: "Admin", action: "Élève en pause", entity: "student", entityId: "stu-3", details: "Sophie Martin — motif personnel", timestamp: addDays(today, -7).toISOString() },
  { id: "log-8", organizationId: "org-1", userId: "admin", userName: "Admin", action: "Véhicule en maintenance", entity: "vehicle", entityId: "veh-4", details: "Dacia Sandero MN-012-OP — révision", timestamp: addDays(today, -4).toISOString() },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getStudentName(id: string): string {
  const s = students.find((s) => s.id === id);
  return s ? `${s.firstName} ${s.lastName}` : "Inconnu";
}

export function getInstructorName(id: string): string {
  const i = instructors.find((i) => i.id === id);
  return i ? `${i.firstName} ${i.lastName}` : "Inconnu";
}

export function getVehicleLabel(id: string): string {
  const v = vehicles.find((v) => v.id === id);
  return v ? `${v.brand} ${v.model} · ${v.plate}` : "Inconnu";
}

export function getStudentFormula(studentId: string): StudentFormula | undefined {
  return studentFormulas.find((sf) => sf.studentId === studentId && sf.active);
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
