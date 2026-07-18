import { describe, it, expect } from "vitest";
import { computeHealthScore } from "@/hooks/useStudentHealthScore";

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const lesson = (status: string, nDaysAgo: number, hours = 1) => ({
  id: `${status}-${nDaysAgo}`,
  status,
  date: daysAgo(nDaysAgo),
  duration_hours: hours,
});

describe("computeHealthScore", () => {
  it("aucune donnée → tous les axes neutres (50)", () => {
    const s = computeHealthScore([], [], [], 0);
    expect(s.attendance).toBe(50);
    expect(s.progression).toBe(50);
    expect(s.financial).toBe(50);
    expect(s.cancellation).toBe(100);
  });

  it("assiduité parfaite sur 90 jours → 100", () => {
    const lessons = [lesson("effectue", 10), lesson("effectue", 20)];
    const s = computeHealthScore(lessons, [], [], 0);
    expect(s.attendance).toBe(100);
  });

  it("le forfait épuisé fait chuter l'axe financier à 10", () => {
    const lessons = [lesson("effectue", 10, 10), lesson("effectue", 20, 10)];
    const formulas = [{ id: "f1", hours_bought: 20, active: true }];
    const s = computeHealthScore(lessons, formulas, [], 0);
    expect(s.financial).toBe(10);
  });

  it("forfait largement disponible → axe financier haut", () => {
    const lessons = [lesson("effectue", 10, 2)];
    const formulas = [{ id: "f1", hours_bought: 20, active: true }];
    const s = computeHealthScore(lessons, formulas, [], 0);
    expect(s.financial).toBe(90);
  });

  it("40 % d'annulations → axe annulation à 0", () => {
    const lessons = [
      lesson("annule", 5), lesson("annule", 6),
      lesson("effectue", 7), lesson("effectue", 8), lesson("effectue", 9),
    ];
    const s = computeHealthScore(lessons, [], [], 0);
    expect(s.cancellation).toBe(0);
  });

  it("les séances de plus de 90 jours ne comptent ni pour l'assiduité ni pour les annulations", () => {
    const lessons = [lesson("annule", 120), lesson("effectue", 10)];
    const s = computeHealthScore(lessons, [], [], 0);
    expect(s.attendance).toBe(100);
    expect(s.cancellation).toBe(100);
  });

  it("progression = moyenne de la dernière évaluation par compétence", () => {
    const evals = [
      { score: 5, category_id: "c1", evaluated_at: daysAgo(1) }, // dernière c1
      { score: 1, category_id: "c1", evaluated_at: daysAgo(30) }, // ancienne, ignorée
      { score: 3, category_id: "c2", evaluated_at: daysAgo(2) },
    ];
    const s = computeHealthScore([], [], evals, 2);
    expect(s.progression).toBe(80); // (5+3)/2 = 4 → 4/5 = 80 %
  });

  it("niveau critique quand tout va mal", () => {
    const lessons = [lesson("annule", 5), lesson("absent", 6), lesson("annule", 7)];
    const formulas = [{ id: "f1", hours_bought: 1, active: true }];
    const s = computeHealthScore(
      [...lessons, lesson("effectue", 8, 2)],
      formulas, [], 0
    );
    expect(s.level).toBe("critique");
  });
});
