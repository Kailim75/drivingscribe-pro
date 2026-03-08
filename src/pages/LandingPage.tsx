import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, FileText, CreditCard, TrendingUp, Smartphone,
  ChevronDown, ArrowRight, Check, X, Shield, Clock,
  Eye, AlertTriangle, BarChart3, Car, UserCheck, Receipt, Bell,
  Zap, Target, PieChart, Menu, Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ──────────────── helpers ──────────────── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const SectionWrapper = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-20 md:py-28 ${className}`}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">{children}</div>
  </section>
);

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
    <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">{children}</motion.h2>
    {sub && <motion.p {...fade(0.08)} className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">{sub}</motion.p>}
  </div>
);

/* ──────────────── NAV ──────────────── */
function Nav({ onCTA }: { onCTA: () => void }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const links = [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">DF</span>
          </div>
          <span className="font-semibold text-foreground text-lg tracking-tight">DriveFlow</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
          ))}
          <Button variant="ghost" size="sm" onClick={() => navigate("/connexion")} className="text-sm text-muted-foreground">Connexion</Button>
          <Button size="sm" onClick={onCTA} className="text-sm">Demander une démo</Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2.5 -mr-1 text-muted-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-5 pb-5 space-y-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground">{l.label}</a>
          ))}
          <div className="pt-2 space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-center text-muted-foreground h-11" onClick={() => { setOpen(false); navigate("/connexion"); }}>Connexion</Button>
            <Button size="sm" className="w-full h-11" onClick={() => { setOpen(false); onCTA(); }}>Demander une démo</Button>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ──────────────── HERO LIVE UI PREVIEWS ──────────────── */
const heroTabs = [
  { label: "Tableau de bord", key: "dashboard" },
  { label: "Planning", key: "planning" },
  { label: "Rentabilité", key: "profitability" },
] as const;

/* Mini KPI card used in dashboard preview */
function MiniKPI({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${accent ? "border-primary/30 bg-primary/[0.06]" : "border-border/30 bg-card/60"}`}>
      <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">{label}</div>
      <div className={`text-base sm:text-xl font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

/* Dashboard preview */
function DashboardPreview() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <MiniKPI label="Chiffre d'affaires" value="12 480 €" sub="Ce mois" accent />
        <MiniKPI label="Séances réalisées" value="64" sub="Sur 72 planifiées" />
        <MiniKPI label="Impayés" value="1 240 €" sub="3 élèves" />
        <MiniKPI label="Heures restantes" value="38h" sub="Tous élèves" />
      </div>
      {/* Chart placeholder */}
      <div className="rounded-lg border border-border/30 bg-card/40 p-4">
        <div className="text-xs text-muted-foreground mb-3">Évolution du CA — 6 derniers mois</div>
        <div className="flex items-end gap-1.5 h-20 sm:h-28">
          {[40, 55, 48, 65, 72, 80].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-sm bg-primary/60" style={{ height: `${h}%` }} />
              <span className="text-[8px] text-muted-foreground/60">{["Oct", "Nov", "Déc", "Jan", "Fév", "Mar"][i]}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Recent activity */}
      <div className="rounded-lg border border-border/30 bg-card/40 p-4">
        <div className="text-xs text-muted-foreground mb-2">Dernières séances</div>
        <div className="space-y-2">
          {[
            { name: "L. Martin", time: "14:00 – 16:00", status: "Effectuée" },
            { name: "S. Durand", time: "16:30 – 18:30", status: "Planifiée" },
            { name: "M. Bernard", time: "09:00 – 11:00", status: "Effectuée" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center text-[10px] font-medium text-muted-foreground">{s.name[0]}</div>
                <span className="text-xs text-foreground">{s.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{s.time}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.status === "Effectuée" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Planning preview */
function PlanningPreview() {
  const days = ["Lun 10", "Mar 11", "Mer 12", "Jeu 13", "Ven 14"];
  const slots = [
    { day: 0, top: "8%", height: "18%", label: "L. Martin", color: "bg-primary/20 border-primary/30 text-primary" },
    { day: 0, top: "30%", height: "15%", label: "S. Durand", color: "bg-info/15 border-info/25 text-info" },
    { day: 1, top: "12%", height: "22%", label: "M. Bernard", color: "bg-success/15 border-success/25 text-success" },
    { day: 1, top: "50%", height: "18%", label: "A. Petit", color: "bg-primary/20 border-primary/30 text-primary" },
    { day: 2, top: "5%", height: "25%", label: "P. Roux", color: "bg-warning/15 border-warning/25 text-warning" },
    { day: 2, top: "40%", height: "15%", label: "L. Martin", color: "bg-info/15 border-info/25 text-info" },
    { day: 3, top: "15%", height: "20%", label: "C. Lefèvre", color: "bg-success/15 border-success/25 text-success" },
    { day: 3, top: "55%", height: "22%", label: "S. Durand", color: "bg-primary/20 border-primary/30 text-primary" },
    { day: 4, top: "10%", height: "18%", label: "M. Bernard", color: "bg-warning/15 border-warning/25 text-warning" },
    { day: 4, top: "38%", height: "20%", label: "A. Petit", color: "bg-info/15 border-info/25 text-info" },
  ];
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-foreground">Semaine du 10 mars 2025</div>
        <div className="flex items-center gap-1.5">
          <div className="px-2 py-1 rounded text-[10px] bg-secondary/40 text-muted-foreground">Semaine</div>
          <div className="px-2 py-1 rounded text-[10px] text-muted-foreground/60">Mois</div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {days.map((d, di) => (
          <div key={di}>
            <div className="text-center text-[10px] text-muted-foreground mb-1.5 font-medium">{d}</div>
            <div className="relative rounded-lg border border-border/25 bg-card/30 h-40 sm:h-56">
              {slots.filter(s => s.day === di).map((s, si) => (
                <div
                  key={si}
                  className={`absolute left-1 right-1 rounded border text-[8px] sm:text-[10px] px-1.5 py-1 truncate ${s.color}`}
                  style={{ top: s.top, height: s.height }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Profitability preview */
function ProfitabilityPreview() {
  const rows = [
    { name: "L. Martin", ca: "2 400 €", cost: "960 €", margin: "60%", trend: "up" },
    { name: "S. Durand", ca: "1 800 €", cost: "640 €", margin: "64%", trend: "up" },
    { name: "M. Bernard", ca: "3 100 €", cost: "1 380 €", margin: "55%", trend: "down" },
    { name: "A. Petit", ca: "1 200 €", cost: "480 €", margin: "60%", trend: "up" },
  ];
  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MiniKPI label="CA total" value="8 500 €" accent />
        <MiniKPI label="Charges" value="3 460 €" />
        <MiniKPI label="Marge nette" value="59%" sub="+3% vs mois précédent" />
      </div>
      {/* Table */}
      <div className="rounded-lg border border-border/30 bg-card/40 overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-3 sm:px-4 py-2 border-b border-border/25 text-[10px] text-muted-foreground font-medium">
          <span className="col-span-1">Élève</span>
          <span>CA</span>
          <span>Charges</span>
          <span>Marge</span>
          <span className="text-right">Tendance</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 px-3 sm:px-4 py-2.5 border-b border-border/15 last:border-0 items-center">
            <div className="col-span-1 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-secondary/60 flex items-center justify-center text-[9px] font-medium text-muted-foreground shrink-0">{r.name[0]}</div>
              <span className="text-xs text-foreground truncate">{r.name}</span>
            </div>
            <span className="text-xs text-foreground tabular-nums">{r.ca}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{r.cost}</span>
            <span className="text-xs text-success tabular-nums font-medium">{r.margin}</span>
            <div className="text-right">
              <span className={`text-[10px] ${r.trend === "up" ? "text-success" : "text-destructive"}`}>
                {r.trend === "up" ? "↑" : "↓"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const heroViews: Record<string, () => JSX.Element> = {
  dashboard: DashboardPreview,
  planning: PlanningPreview,
  profitability: ProfitabilityPreview,
};

function HeroScreenshots() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const INTERVAL = 5000;

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = (elapsed % INTERVAL) / INTERVAL;
      setProgress(pct * 100);
      if (elapsed > 0 && elapsed % INTERVAL < 20) {
        setActive((prev) => (prev + 1) % heroTabs.length);
      }
    };
    const id = setInterval(tick, 40);
    return () => clearInterval(id);
  }, []);

  const handleTab = useCallback((i: number) => {
    setActive(i);
    setProgress(0);
  }, []);

  const ActiveView = heroViews[heroTabs[active].key];

  return (
    <motion.div {...fade(0.2)} className="mt-14 md:mt-20 relative">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-b from-primary/6 via-primary/2 to-transparent blur-3xl pointer-events-none" />
      <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-secondary/20">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-md bg-secondary/40 text-[11px] text-muted-foreground font-mono">app.driveflow.fr</div>
          </div>
        </div>

        {/* Live UI preview */}
        <div className="relative bg-background/80 min-h-[280px] sm:min-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tabs with progress */}
        <div className="flex items-center justify-center gap-2 p-3 border-t border-border/40 bg-secondary/15">
          {heroTabs.map((s, i) => (
            <button
              key={i}
              onClick={() => handleTab(i)}
              className={`relative px-4 py-2 rounded-lg text-xs font-medium transition-all overflow-hidden ${
                active === i
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              {active === i && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-primary/60 transition-none"
                  style={{ width: `${progress}%` }}
                />
              )}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────── S1 HERO ──────────────── */
function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fade()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Bêta fondatrice — Places limitées</span>
          </motion.div>

          <motion.h1 {...fade(0.04)} className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.12] text-foreground">
            Le logiciel de gestion et de rentabilité pour{" "}
            <span className="text-gradient">professionnels de la conduite</span>
          </motion.h1>

          <motion.p {...fade(0.08)} className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Heures, élèves, factures, paiements et rentabilité — tout dans un seul outil pensé pour le terrain.
          </motion.p>

          <motion.div {...fade(0.12)} className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onCTA} className="w-full sm:w-auto text-base px-8 h-12 glow-primary">
              Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={onCTA} className="w-full sm:w-auto text-base px-8 h-12">
              Rejoindre la bêta
            </Button>
          </motion.div>

          <motion.p {...fade(0.16)} className="mt-4 text-xs text-muted-foreground/70">
            Formateurs indépendants · Auto-écoles · Centres Taxi / VTC / VMDTR
          </motion.p>
        </div>

        <HeroScreenshots />
      </div>
    </section>
  );
}

/* ──────────────── S2 PROBLEME ──────────────── */
function ProblemSection() {
  const problems = [
    { icon: Clock, text: "Heures mal suivies, créneaux perdus" },
    { icon: AlertTriangle, text: "Paiements en retard, impayés non détectés" },
    { icon: FileText, text: "Administratif chronophage et répétitif" },
    { icon: Eye, text: "Aucune visibilité sur la rentabilité réelle" },
    { icon: Users, text: "Organisation compliquée quand l'activité grandit" },
  ];
  return (
    <SectionWrapper className="border-t border-border/20">
      <SectionTitle sub="Vous gérez vos séances sur un agenda, vos paiements dans un tableur et votre rentabilité… à l'aveugle.">
        Trop d'outils, trop de temps perdu, pas assez de visibilité
      </SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
        {problems.map((p, i) => (
          <motion.div key={i} {...fade(i * 0.05)} className="flex items-start gap-3 rounded-xl border border-border/30 bg-card/30 p-4 sm:p-5">
            <div className="mt-0.5 p-2 rounded-lg bg-destructive/8 shrink-0"><p.icon className="w-4 h-4 text-destructive/80" /></div>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S3 SOLUTION ──────────────── */
function SolutionSection() {
  const items = [
    { icon: Users, label: "Gestion des élèves" },
    { icon: Calendar, label: "Planning & séances" },
    { icon: UserCheck, label: "Formateur + véhicule" },
    { icon: FileText, label: "Devis & factures" },
    { icon: CreditCard, label: "Paiements & impayés" },
    { icon: Bell, label: "Rappels" },
    { icon: TrendingUp, label: "Rentabilité" },
  ];
  return (
    <SectionWrapper>
      <SectionTitle sub="Un seul logiciel pour piloter toute votre activité au quotidien.">
        Tout votre pilotage dans un seul logiciel
      </SectionTitle>
      <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 max-w-3xl mx-auto">
        {items.map((it, i) => (
          <motion.div key={i} {...fade(i * 0.03)} className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/40 bg-card/40 text-sm text-foreground">
            <it.icon className="w-4 h-4 text-primary shrink-0" />
            {it.label}
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S4 DIFFERENCIATION ──────────────── */
function DifferentiationSection() {
  const items = [
    { icon: PieChart, title: "Rentabilité par élève", desc: "Savez-vous combien chaque élève vous rapporte vraiment ?" },
    { icon: UserCheck, title: "Rentabilité par formateur", desc: "Comparez le coût de chaque formateur avec le CA généré." },
    { icon: Car, title: "Rentabilité par véhicule", desc: "Identifiez les véhicules rentables et ceux qui coûtent trop cher." },
    { icon: Receipt, title: "Suivi des impayés", desc: "Détectez les retards avant qu'ils ne s'accumulent." },
    { icon: Clock, title: "Heures restantes", desc: "Heures achetées vs réalisées, en un coup d'œil." },
    { icon: Target, title: "Créneaux perdus", desc: "Annulations et no-shows pour optimiser votre planning." },
  ];
  return (
    <SectionWrapper className="border-t border-border/20">
      <SectionTitle sub="DriveFlow ne gère pas vos rendez-vous. Il vous donne les indicateurs pour prendre les bonnes décisions.">
        Plus qu'un agenda : un vrai outil de pilotage
      </SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
        {items.map((it, i) => (
          <motion.div key={i} {...fade(i * 0.05)} className="rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6 hover:border-primary/25 transition-colors group">
            <div className="p-2.5 rounded-xl bg-primary/8 w-fit mb-3"><it.icon className="w-5 h-5 text-primary" /></div>
            <h3 className="font-semibold text-foreground mb-1">{it.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S5 FONCTIONNALITES ──────────────── */
function FeaturesSection() {
  const features = [
    { icon: Users, title: "Gestion des élèves", desc: "Fiches complètes, suivi de progression, statut et historique." },
    { icon: Calendar, title: "Planning intelligent", desc: "Détection de conflits, affectation formateur + véhicule." },
    { icon: FileText, title: "Devis et factures", desc: "Numérotation automatique, conversion devis → facture, PDF." },
    { icon: CreditCard, title: "Suivi des règlements", desc: "Paiements partiels, reste à payer, détection des impayés." },
    { icon: TrendingUp, title: "Rentabilité réelle", desc: "Vue par élève, formateur et véhicule. Sans tableur." },
    { icon: Smartphone, title: "Pensé pour le terrain", desc: "Interface mobile-first, rapide. Utilisable entre deux séances." },
  ];
  return (
    <SectionWrapper id="fonctionnalites">
      <SectionTitle sub="Chaque fonctionnalité répond à un besoin concret des professionnels de la conduite.">
        Les fonctionnalités essentielles
      </SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
        {features.map((f, i) => (
          <motion.div key={i} {...fade(i * 0.05)} className="rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6">
            <div className="p-2.5 rounded-xl bg-secondary/60 w-fit mb-3"><f.icon className="w-5 h-5 text-primary" /></div>
            <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S6 CIBLES ──────────────── */
function AudienceSection() {
  const profiles = [
    { icon: UserCheck, title: "Formateur indépendant", desc: "Organisez vos séances, facturez proprement, suivez vos revenus." },
    { icon: Users, title: "Petit centre", desc: "Gérez formateurs et véhicules, gardez la visibilité sur chaque indicateur." },
    { icon: BarChart3, title: "Structure organisée", desc: "Multi-sites, multi-activités : DriveFlow s'adapte à votre échelle." },
  ];
  return (
    <SectionWrapper className="border-t border-border/20">
      <SectionTitle>Conçu pour les professionnels de la conduite</SectionTitle>
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
        {profiles.map((p, i) => (
          <motion.div key={i} {...fade(i * 0.06)} className="rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6 text-center">
            <div className="p-3 rounded-xl bg-primary/8 w-fit mx-auto mb-4"><p.icon className="w-5 h-5 text-primary" /></div>
            <h3 className="font-semibold text-foreground mb-1.5">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S7 BENEFICES ──────────────── */
function BenefitsSection() {
  const benefits = [
    "Réduire le temps administratif",
    "Mieux suivre les heures achetées et réalisées",
    "Limiter les erreurs de planification",
    "Suivre les paiements plus facilement",
    "Visualiser les impayés en un coup d'œil",
    "Comprendre la rentabilité sans tableur",
    "Structurer l'activité avec un outil professionnel",
  ];
  return (
    <SectionWrapper>
      <SectionTitle>Ce que DriveFlow vous apporte concrètement</SectionTitle>
      <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-2.5">
        {benefits.map((b, i) => (
          <motion.div key={i} {...fade(i * 0.03)} className="flex items-center gap-3 py-3 px-4 rounded-xl border border-border/25 bg-card/25">
            <Check className="w-4 h-4 text-success shrink-0" />
            <span className="text-sm text-foreground">{b}</span>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S8 TARIFS ──────────────── */
function PricingSection({ onCTA }: { onCTA: () => void }) {
  const plans = [
    {
      name: "Solo",
      price: "49",
      desc: "Formateur indépendant",
      features: ["1 formateur", "Gestion des élèves", "Planning", "Devis & factures", "Suivi des paiements", "Rentabilité de base"],
      highlighted: false,
    },
    {
      name: "Pro",
      price: "89",
      desc: "Petit centre de formation",
      features: ["Jusqu'à 5 formateurs", "Multi-véhicules", "Tout Solo +", "Rentabilité par formateur", "Rentabilité par véhicule", "Rappels automatiques"],
      highlighted: true,
    },
    {
      name: "Centre",
      price: "149",
      desc: "Structure organisée",
      features: ["Formateurs illimités", "Multi-activités", "Tout Pro +", "Rôles & permissions", "Journal d'activité", "Accompagnement dédié"],
      highlighted: false,
    },
  ];
  return (
    <SectionWrapper id="tarifs" className="border-t border-border/20">
      <SectionTitle sub="Pas de surprise, pas d'engagement caché. Choisissez le plan adapté à votre activité.">
        Des offres simples, adaptées à votre structure
      </SectionTitle>
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto items-start">
        {plans.map((p, i) => (
          <motion.div
            key={i}
            {...fade(i * 0.06)}
            className={`rounded-2xl border p-6 flex flex-col relative ${
              p.highlighted
                ? "border-primary/40 bg-primary/[0.04] shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                : "border-border/40 bg-card/40"
            }`}
          >
            {p.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium text-primary-foreground bg-primary px-3 py-1 rounded-full">Recommandé</span>
            )}
            <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 mb-4">{p.desc}</p>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums">{p.price} €</span>
              <span className="text-sm text-muted-foreground">/ mois</span>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {p.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={onCTA}
              variant={p.highlighted ? "default" : "outline"}
              className={`w-full h-11 text-sm ${p.highlighted ? "glow-primary" : ""}`}
            >
              Demander une démo
            </Button>
          </motion.div>
        ))}
      </div>
      <motion.p {...fade(0.25)} className="text-center text-xs text-muted-foreground/70 mt-8">
        Possibilité d'accompagnement au paramétrage et à la prise en main.
      </motion.p>
    </SectionWrapper>
  );
}

/* ──────────────── S9 BETA ──────────────── */
function BetaSection({ onCTA }: { onCTA: () => void }) {
  return (
    <SectionWrapper>
      <div className="max-w-3xl mx-auto text-center">
        <motion.div {...fade()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Accès anticipé</span>
        </motion.div>
        <motion.h2 {...fade(0.04)} className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Rejoignez la bêta fondatrice
        </motion.h2>
        <motion.p {...fade(0.08)} className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Faites partie des premiers utilisateurs et contribuez à façonner le produit. Tarif préférentiel garanti.
        </motion.p>
        <motion.div {...fade(0.12)} className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={onCTA} className="w-full sm:w-auto text-base px-8 h-12 glow-primary">
            Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={onCTA} className="w-full sm:w-auto text-base px-8 h-12">
            Rejoindre la bêta fondatrice
          </Button>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S10 CREDIBILITE ──────────────── */
function CredibilitySection() {
  return (
    <SectionWrapper className="border-t border-border/20">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2 {...fade()} className="text-2xl sm:text-3xl font-bold text-foreground">
          Développé à partir des besoins réels du terrain
        </motion.h2>
        <motion.p {...fade(0.06)} className="mt-4 text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Conçu en collaboration avec des formateurs et des gérants de centres. Chaque fonctionnalité répond à un problème concret.
        </motion.p>
        <motion.div {...fade(0.12)} className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            { icon: Shield, text: "Données sécurisées" },
            { icon: Smartphone, text: "Mobile-first" },
            { icon: Zap, text: "Mises à jour continues" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/40 bg-card/30 text-sm text-muted-foreground">
              <t.icon className="w-4 h-4 text-primary" /> {t.text}
            </div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S11 FAQ ──────────────── */
function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = [
    { q: "À qui s'adresse DriveFlow ?", a: "Aux formateurs indépendants, auto-écoles, centres Taxi, VTC et VMDTR, ainsi qu'aux structures mixtes multi-activités." },
    { q: "L'application est-elle utilisable sur mobile ?", a: "Oui. DriveFlow est conçu mobile-first pour être utilisé rapidement entre deux séances, sur smartphone ou tablette." },
    { q: "Peut-on gérer plusieurs formateurs et véhicules ?", a: "Oui. Selon votre plan, vous gérez plusieurs formateurs, véhicules et activités. Le planning détecte automatiquement les conflits." },
    { q: "Comment fonctionne le suivi des paiements ?", a: "DriveFlow suit les paiements facture par facture, détecte les impayés et les paiements partiels, et vous alerte en cas de retard." },
    { q: "Comment est calculée la rentabilité ?", a: "À partir du CA généré par élève, formateur ou véhicule, comparé aux coûts réels (heures, charges véhicule, etc.)." },
    { q: "Comment demander une démo ?", a: "Cliquez sur « Demander une démo » et remplissez le formulaire. Nous vous recontacterons sous 48 heures." },
  ];
  return (
    <SectionWrapper id="faq" className="border-t border-border/20">
      <SectionTitle>Questions fréquentes</SectionTitle>
      <div className="max-w-2xl mx-auto space-y-2">
        {faqs.map((f, i) => (
          <motion.div key={i} {...fade(i * 0.03)} className="rounded-xl border border-border/30 bg-card/25 overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
              aria-expanded={openIdx === i}
            >
              <span className="text-sm font-medium text-foreground">{f.q}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${openIdx === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S12 CTA FINAL ──────────────── */
function FinalCTA({ onCTA }: { onCTA: () => void }) {
  return (
    <SectionWrapper>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Envie de découvrir DriveFlow ?
        </motion.h2>
        <motion.p {...fade(0.06)} className="mt-4 text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Demandez une démonstration et voyez comment simplifier votre gestion tout en gagnant en visibilité sur votre rentabilité.
        </motion.p>
        <motion.div {...fade(0.12)} className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={onCTA} className="w-full sm:w-auto text-base px-8 h-12 glow-primary">
            Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={onCTA} className="w-full sm:w-auto text-base px-8 h-12">
            Rejoindre la bêta
          </Button>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── FORM MODAL ──────────────── */
function BetaFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    lastName: "", firstName: "", structureName: "", structureType: "",
    phone: "", email: "", instructorCount: "", vehicleCount: "", message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (fields = form) => {
    const e: Record<string, string> = {};
    if (!fields.lastName.trim()) e.lastName = "Requis";
    if (!fields.firstName.trim()) e.firstName = "Requis";
    if (!fields.email.trim()) e.email = "Requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = "Email invalide";
    if (!fields.structureType) e.structureType = "Requis";
    return e;
  };

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(form));
  };

  const handleChange = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validate(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ lastName: true, firstName: true, email: true, structureType: true });
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast({ title: "Demande envoyée !", description: "Nous vous recontacterons sous 48 heures." });
  };

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const fieldClass = "bg-secondary/40 border-border/40 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60 h-11";
  const errorFor = (field: string) =>
    touched[field] && errors[field] ? <span className="text-xs text-destructive mt-1 block">{errors[field]}</span> : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/85 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl"
      >
        <div className="sticky top-0 bg-card/98 backdrop-blur-xl px-6 py-5 border-b border-border/30 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">Rejoindre la bêta DriveFlow</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Nous vous recontacterons sous 48h.</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-5">
              <Check className="w-7 h-7 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Demande envoyée !</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">Merci pour votre intérêt. Notre équipe vous contactera très bientôt.</p>
            <Button variant="outline" onClick={onClose} className="h-11 px-6">Fermer</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom <span className="text-destructive">*</span></label>
                <Input className={fieldClass} value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} onBlur={() => handleBlur("lastName")} placeholder="Dupont" />
                {errorFor("lastName")}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prénom <span className="text-destructive">*</span></label>
                <Input className={fieldClass} value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} onBlur={() => handleBlur("firstName")} placeholder="Jean" />
                {errorFor("firstName")}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom de la structure</label>
              <Input className={fieldClass} value={form.structureName} onChange={(e) => handleChange("structureName", e.target.value)} placeholder="Auto-école du Centre" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de structure <span className="text-destructive">*</span></label>
              <Select value={form.structureType} onValueChange={(v) => { handleChange("structureType", v); setTouched((t) => ({ ...t, structureType: true })); }}>
                <SelectTrigger className={fieldClass}><SelectValue placeholder="Sélectionnez…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="independant">Formateur indépendant</SelectItem>
                  <SelectItem value="auto_ecole">Auto-école</SelectItem>
                  <SelectItem value="taxi">Centre Taxi</SelectItem>
                  <SelectItem value="vtc">Centre VTC</SelectItem>
                  <SelectItem value="vmdtr">Centre VMDTR</SelectItem>
                  <SelectItem value="mixte">Structure mixte</SelectItem>
                </SelectContent>
              </Select>
              {errorFor("structureType")}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Téléphone</label>
                <Input className={fieldClass} type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email <span className="text-destructive">*</span></label>
                <Input className={fieldClass} type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")} placeholder="jean@exemple.fr" />
                {errorFor("email")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Formateurs</label>
                <Input className={fieldClass} type="number" min="1" value={form.instructorCount} onChange={(e) => handleChange("instructorCount", e.target.value)} placeholder="1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Véhicules</label>
                <Input className={fieldClass} type="number" min="1" value={form.vehicleCount} onChange={(e) => handleChange("vehicleCount", e.target.value)} placeholder="1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
              <Textarea className={`${fieldClass} min-h-[80px] h-auto`} value={form.message} onChange={(e) => handleChange("message", e.target.value)} placeholder="Décrivez votre besoin…" />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-medium glow-primary">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</span>
              ) : (
                "Envoyer ma demande"
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground/60 text-center">Vos données sont traitées uniquement dans le cadre de cette demande.</p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

/* ──────────────── S13 FOOTER ──────────────── */
function Footer() {
  return (
    <footer className="border-t border-border/20 py-12">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">DF</span>
            </div>
            <span className="font-semibold text-foreground">DriveFlow</span>
            <span className="text-xs text-muted-foreground/60 ml-1">Gestion & Rentabilité</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#beta" className="hover:text-foreground transition-colors">Démo</a>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} DriveFlow. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

/* ──────────────── MAIN PAGE ──────────────── */
export default function LandingPage() {
  const [formOpen, setFormOpen] = useState(false);
  const openForm = () => setFormOpen(true);

  return (
    <>
      <Nav onCTA={openForm} />
      <main className="bg-background text-foreground">
        <Hero onCTA={openForm} />
        <ProblemSection />
        <SolutionSection />
        <DifferentiationSection />
        <FeaturesSection />
        <AudienceSection />
        <BenefitsSection />
        <PricingSection onCTA={openForm} />
        <div id="beta"><BetaSection onCTA={openForm} /></div>
        <CredibilitySection />
        <FAQSection />
        <FinalCTA onCTA={openForm} />
        <Footer />
      </main>
      <BetaFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
