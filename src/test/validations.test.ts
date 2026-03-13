import { describe, it, expect } from "vitest";
import { studentSchema, instructorSchema, vehicleSchema, offerSchema, lessonSchema } from "@/lib/validations";

describe("studentSchema", () => {
  it("accepts valid student data", () => {
    const result = studentSchema.safeParse({
      first_name: "Jean",
      last_name: "Dupont",
      phone: "0612345678",
      email: "jean@test.fr",
      activity_type: "auto_ecole",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty first_name", () => {
    const result = studentSchema.safeParse({ first_name: "", last_name: "Dupont" });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toBe("Le prénom est requis");
  });

  it("rejects empty last_name", () => {
    const result = studentSchema.safeParse({ first_name: "Jean", last_name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = studentSchema.safeParse({ first_name: "Jean", last_name: "Dupont", email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("accepts empty email", () => {
    const result = studentSchema.safeParse({ first_name: "Jean", last_name: "Dupont", email: "" });
    expect(result.success).toBe(true);
  });

  it("rejects name exceeding 100 chars", () => {
    const result = studentSchema.safeParse({ first_name: "A".repeat(101), last_name: "B" });
    expect(result.success).toBe(false);
  });
});

describe("instructorSchema", () => {
  it("accepts valid instructor", () => {
    const result = instructorSchema.safeParse({
      first_name: "Marie",
      last_name: "Martin",
      hourly_cost: 25,
      specialties: ["auto_ecole"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative hourly_cost", () => {
    const result = instructorSchema.safeParse({
      first_name: "Marie",
      last_name: "Martin",
      hourly_cost: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("vehicleSchema", () => {
  it("accepts valid vehicle", () => {
    const result = vehicleSchema.safeParse({ plate: "AB-123-CD", brand: "Renault", model: "Clio" });
    expect(result.success).toBe(true);
  });

  it("rejects empty plate", () => {
    const result = vehicleSchema.safeParse({ plate: "" });
    expect(result.success).toBe(false);
  });
});

describe("offerSchema", () => {
  it("accepts valid offer", () => {
    const result = offerSchema.safeParse({ name: "Pack 20h", type: "pack", price: 800, hours: 20 });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = offerSchema.safeParse({ name: "Test", type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = offerSchema.safeParse({ name: "Test", price: -10 });
    expect(result.success).toBe(false);
  });
});

describe("lessonSchema", () => {
  it("accepts valid lesson", () => {
    const result = lessonSchema.safeParse({
      student_id: "123e4567-e89b-12d3-a456-426614174000",
      instructor_id: "123e4567-e89b-12d3-a456-426614174001",
      vehicle_id: "123e4567-e89b-12d3-a456-426614174002",
      date: "2026-03-13",
      start_time: "09:00",
      end_time: "10:00",
      duration_hours: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing student_id", () => {
    const result = lessonSchema.safeParse({
      student_id: "",
      instructor_id: "abc",
      vehicle_id: "def",
      date: "2026-03-13",
      start_time: "09:00",
      end_time: "10:00",
      duration_hours: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration less than 15 min", () => {
    const result = lessonSchema.safeParse({
      student_id: "a",
      instructor_id: "b",
      vehicle_id: "c",
      date: "2026-03-13",
      start_time: "09:00",
      end_time: "09:10",
      duration_hours: 0.1,
    });
    expect(result.success).toBe(false);
  });
});
