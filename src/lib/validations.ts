import { z } from "zod";

export const studentSchema = z.object({
  first_name: z.string().trim().min(1, "Le prénom est requis").max(100, "100 caractères maximum"),
  last_name: z.string().trim().min(1, "Le nom est requis").max(100, "100 caractères maximum"),
  phone: z.string().max(20, "20 caractères maximum").optional().default(""),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional().default(""),
  address: z.string().max(500).optional().default(""),
  activity_type: z.string().default("auto_ecole"),
  notes: z.string().max(1000).optional().default(""),
});

export const instructorSchema = z.object({
  first_name: z.string().trim().min(1, "Le prénom est requis").max(100),
  last_name: z.string().trim().min(1, "Le nom est requis").max(100),
  phone: z.string().max(20).optional().default(""),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional().default(""),
  hourly_cost: z.number().min(0, "Le coût doit être positif").default(0),
  specialties: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional().default(""),
});

export const vehicleSchema = z.object({
  plate: z.string().trim().min(1, "L'immatriculation est requise").max(20),
  brand: z.string().max(50).optional().default(""),
  model: z.string().max(50).optional().default(""),
  category: z.string().default("auto_ecole"),
  monthly_cost: z.number().min(0).default(0),
  notes: z.string().max(1000).optional().default(""),
  next_maintenance_date: z.string().nullable().optional(),
  last_maintenance_date: z.string().nullable().optional(),
  insurance_expiry: z.string().nullable().optional(),
  technical_control_date: z.string().nullable().optional(),
});

export const offerSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(200),
  type: z.enum(["heure", "pack", "forfait"]).default("heure"),
  price: z.number().min(0, "Le prix doit être positif").default(0),
  hours: z.number().min(1).nullable().optional(),
  tva_rate: z.number().min(0).max(100).default(20),
  deposit_percent: z.number().min(0).max(100).default(0),
  cancellation_policy: z.string().max(1000).optional().default(""),
  activity_type: z.string().default("auto_ecole"),
  active: z.boolean().default(true),
});

export const lessonSchema = z.object({
  student_id: z.string().min(1, "Élève requis"),
  instructor_id: z.string().min(1, "Formateur requis"),
  vehicle_id: z.string().min(1, "Véhicule requis"),
  date: z.string().min(1, "Date requise"),
  start_time: z.string().min(1, "Heure de début requise"),
  end_time: z.string().min(1, "Heure de fin requise"),
  duration_hours: z.number().min(0.25, "Durée minimum 15 min"),
  note: z.string().max(1000).optional().default(""),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type InstructorFormData = z.infer<typeof instructorSchema>;
export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type OfferFormData = z.infer<typeof offerSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
