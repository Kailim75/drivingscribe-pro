import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, FileText, CreditCard, TrendingUp, Smartphone,
  ChevronDown, ArrowRight, Check, X, Shield, Clock,
  Eye, AlertTriangle, BarChart3, Car, UserCheck, Receipt, Bell,
  Zap, Target, PieChart, Menu, Loader2, CheckCircle2, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ═══════ helpers ═══════ */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, delay, ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number] },
});

/* ═══════ NAV ═══════ */
function Nav({ onCTA }: { onCTA: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <span className="text-sm font-extrabold text-primary-foreground tracking-tight">DF</span>
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">Drivflow</span>
        </a>
        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
          ))}
          <Button variant="ghost" size="sm" onClick={() => navigate("/connexion")} className="text-sm font-medium text-muted-foreground">Connexion</Button>
          <Button size="sm" onClick={onCTA} className="text-sm font-semibold glow-primary h-9 px-5">Demander une démo</Button>
        </div>
        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setOpen(!open)} aria-label="Menu"><Menu className="w-5 h-5" /></button>
      </div>
      {open && (
        <div className="md:hidden bg-background border-b border-border px-5 pb-5 space-y-1 shadow-lg">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground">{l.label}</a>
          ))}
          <div className="pt-2 space-y-2">
            <Button variant="ghost" size="sm" className="w-full h-11" onClick={() => { setOpen(false); navigate("/connexion"); }}>Connexion</Button>
            <Button size="sm" className="w-full h-11 glow-primary" onClick={() => { setOpen(false); onCTA(); }}>Demander une démo</Button>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ═══════ HERO LIVE PREVIEWS ═══════ */
const heroTabs = [
  { label: "Tableau de bord", key: "dashboard" },
  { label: "Planning", key: "planning" },
  { label: "Rentabilité", key: "profitability" },
] as const;

function MiniKPI({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${accent ? "border-primary/30 bg-primary/[0.07]" : "border-border/40 bg-card/80"}`}>
      <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{label}</div>
      <div className={`text-lg sm:text-2xl font-extrabold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <MiniKPI label="Chiffre d'affaires" value="12 480 €" sub="Ce mois" accent />
        <MiniKPI label="Séances" value="64" sub="Sur 72 planifiées" />
        <MiniKPI label="Impayés" value="1 240 €" sub="3 élèves concernés" />
        <MiniKPI label="Heures dispo" value="38h" sub="Tous élèves" />
      </div>
      <div className="rounded-xl border border-border/40 bg-card/60 p-4">
        <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Évolution du CA — 6 derniers mois</div>
        <div className="flex items-end gap-2 h-24 sm:h-32">
          {[40, 55, 48, 65, 72, 85].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-md bg-gradient-to-t from-primary/70 to-primary/40 transition-all" style={{ height: `${h}%` }} />
              <span className="text-[9px] font-medium text-muted-foreground/60">{["Oct", "Nov", "Déc", "Jan", "Fév", "Mar"][i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border/40 bg-card/60 p-4">
        <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Dernières séances</div>
        <div className="space-y-1">
          {[
            { name: "L. Martin", time: "14:00 – 16:00", status: "Effectuée", color: "bg-success/12 text-success" },
            { name: "S. Durand", time: "16:30 – 18:30", status: "Planifiée", color: "bg-primary/12 text-primary" },
            { name: "M. Bernard", time: "09:00 – 11:00", status: "Effectuée", color: "bg-success/12 text-success" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">{s.name[0]}</div>
                <span className="text-sm font-medium text-foreground">{s.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{s.time}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${s.color}`}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanningPreview() {
  const days = ["Lun 10", "Mar 11", "Mer 12", "Jeu 13", "Ven 14"];
  const slots = [
    { day: 0, top: "6%", height: "20%", label: "L. Martin — B", color: "bg-primary/15 border-primary/25 text-primary" },
    { day: 0, top: "32%", height: "16%", label: "S. Durand — B", color: "bg-info/12 border-info/20 text-info" },
    { day: 1, top: "10%", height: "24%", label: "M. Bernard — AAC", color: "bg-success/12 border-success/20 text-success" },
    { day: 1, top: "50%", height: "20%", label: "A. Petit — B", color: "bg-primary/15 border-primary/25 text-primary" },
    { day: 2, top: "4%", height: "28%", label: "P. Roux — CS", color: "bg-warning/12 border-warning/20 text-warning" },
    { day: 2, top: "42%", height: "16%", label: "L. Martin — B", color: "bg-info/12 border-info/20 text-info" },
    { day: 3, top: "12%", height: "22%", label: "C. Lefèvre — B", color: "bg-success/12 border-success/20 text-success" },
    { day: 3, top: "52%", height: "24%", label: "S. Durand — AAC", color: "bg-primary/15 border-primary/25 text-primary" },
    { day: 4, top: "8%", height: "20%", label: "M. Bernard — B", color: "bg-warning/12 border-warning/20 text-warning" },
    { day: 4, top: "36%", height: "22%", label: "A. Petit — CS", color: "bg-info/12 border-info/20 text-info" },
  ];
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Semaine du 10 mars 2025</div>
        <div className="flex items-center gap-1">
          <div className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-primary/10 text-primary">Semaine</div>
          <div className="px-2.5 py-1 rounded-md text-[10px] text-muted-foreground/60">Mois</div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {days.map((d, di) => (
          <div key={di}>
            <div className="text-center text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">{d}</div>
            <div className="relative rounded-xl border border-border/30 bg-card/40 h-44 sm:h-60">
              {slots.filter(s => s.day === di).map((s, si) => (
                <div key={si} className={`absolute left-1 right-1 rounded-lg border text-[8px] sm:text-[10px] font-medium px-1.5 py-1 truncate ${s.color}`} style={{ top: s.top, height: s.height }}>
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

function ProfitabilityPreview() {
  const rows = [
    { name: "L. Martin", ca: "2 400 €", cost: "960 €", margin: "60%", trend: "up" },
    { name: "S. Durand", ca: "1 800 €", cost: "640 €", margin: "64%", trend: "up" },
    { name: "M. Bernard", ca: "3 100 €", cost: "1 380 €", margin: "55%", trend: "down" },
    { name: "A. Petit", ca: "1 200 €", cost: "480 €", margin: "60%", trend: "up" },
  ];
  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <MiniKPI label="CA total" value="8 500 €" accent />
        <MiniKPI label="Charges" value="3 460 €" />
        <MiniKPI label="Marge nette" value="59%" sub="+3 pts vs M-1" />
      </div>
      <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-2.5 border-b border-border/30 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          <span className="col-span-1">Élève</span><span>CA</span><span>Charges</span><span>Marge</span><span className="text-right">Trend</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/15 last:border-0 items-center hover:bg-muted/20 transition-colors">
            <div className="col-span-1 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{r.name[0]}</div>
              <span className="text-xs font-medium text-foreground truncate">{r.name}</span>
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">{r.ca}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{r.cost}</span>
            <span className="text-xs text-success font-bold tabular-nums">{r.margin}</span>
            <div className="text-right">
              <span className={`text-xs font-bold ${r.trend === "up" ? "text-success" : "text-destructive"}`}>{r.trend === "up" ? "↑" : "↓"}</span>
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

function HeroProduct() {
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
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-primary/8 via-primary/3 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/8 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-lg bg-background/80 border border-border/30 text-[11px] text-muted-foreground font-mono">app.driveflow.fr</div>
          </div>
        </div>

        {/* Content */}
        <div className="relative bg-background min-h-[300px] sm:min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1.5 p-3 border-t border-border/40 bg-muted/20">
          {heroTabs.map((s, i) => (
            <button
              key={i}
              onClick={() => handleTab(i)}
              className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-all overflow-hidden ${active === i ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
            >
              {active === i && <div className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full transition-none" style={{ width: `${progress}%` }} />}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════ HERO ═══════ */
function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.div {...fade()} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary tracking-wide">Bêta fondatrice — Places limitées</span>
            </motion.div>

            <motion.h1 {...fade(0.05)} className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-foreground">
              Pilotez votre activité.{" "}
              <span className="text-gradient">Maîtrisez votre rentabilité.</span>
            </motion.h1>

            <motion.p {...fade(0.1)} className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
              Planning, élèves, factures, paiements et rentabilité par élève, formateur et véhicule — <strong className="text-foreground font-semibold">un seul outil pensé pour le terrain.</strong>
            </motion.p>

            <motion.div {...fade(0.15)} className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Button size="lg" onClick={onCTA} className="text-base px-8 h-13 font-semibold glow-primary shadow-lg shadow-primary/15">
                Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="ghost" onClick={onCTA} className="text-sm text-muted-foreground h-13 px-6 font-medium">
                Rejoindre la bêta →
              </Button>
            </motion.div>

            <motion.div {...fade(0.2)} className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> Données sécurisées</span>
              <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-primary" /> Mobile-first</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> Prise en main en 10 min</span>
            </motion.div>

            <motion.p {...fade(0.22)} className="mt-4 text-[11px] text-muted-foreground/60 font-medium">
              Formateurs indépendants · Auto-écoles · Centres Taxi / VTC / VMDTR
            </motion.p>
          </div>

          {/* Right — product */}
          <motion.div {...fade(0.15)}>
            <HeroProduct />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════ SOCIAL PROOF BAR ═══════ */
function SocialProofBar() {
  const stats = [
    { value: "12 480 €", label: "de CA moyen suivi / mois" },
    { value: "3h", label: "gagnées par semaine" },
    { value: "100%", label: "visibilité sur les impayés" },
    { value: "< 10 min", label: "pour prendre en main" },
  ];
  return (
    <section className="py-10 border-y border-border/30 bg-card/50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} {...fade(i * 0.05)} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{s.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ BENEFITS ═══════ */
function BenefitsSection() {
  const benefits = [
    { icon: Target, title: "Centralisez votre activité", desc: "Élèves, séances, formateurs et véhicules dans un seul tableau de bord. Fini les fichiers éparpillés." },
    { icon: CreditCard, title: "Suivez chaque paiement", desc: "Paiements partiels, impayés, reste à payer — détectez les retards avant qu'ils ne s'accumulent." },
    { icon: PieChart, title: "Pilotez votre rentabilité", desc: "Marge par élève, formateur et véhicule. Prenez les bonnes décisions sans tableur." },
    { icon: Clock, title: "Gagnez 3h par semaine", desc: "Factures auto-générées, rappels automatiques, planning intelligent. Concentrez-vous sur la route." },
  ];
  return (
    <section className="py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            4 raisons de passer à DriveFlow
          </motion.h2>
          <motion.p {...fade(0.05)} className="mt-3 text-muted-foreground">Des bénéfices concrets, mesurables dès le premier mois.</motion.p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {benefits.map((b, i) => (
            <motion.div key={i} {...fade(i * 0.06)} className="rounded-2xl border border-border/40 bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                <b.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ PROBLEM ═══════ */
function ProblemSection() {
  const problems = [
    { icon: Clock, text: "Heures mal suivies, créneaux perdus, planning difficile à gérer" },
    { icon: AlertTriangle, text: "Paiements en retard et impayés non détectés à temps" },
    { icon: FileText, text: "Administratif chronophage : devis, factures, relances manuelles" },
    { icon: Eye, text: "Aucune visibilité sur la rentabilité réelle de l'activité" },
    { icon: Users, text: "Organisation compliquée dès que l'activité grandit" },
  ];
  return (
    <section className="section-dark py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary-foreground tracking-tight">
            Vous reconnaissez ces problèmes ?
          </motion.h2>
          <motion.p {...fade(0.05)} className="mt-3 text-primary-foreground/60">
            Agenda papier, tableur Excel, relevé bancaire… Vous perdez du temps et de l'argent.
          </motion.p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {problems.map((p, i) => (
            <motion.div key={i} {...fade(i * 0.05)} className="flex items-start gap-3.5 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.04] p-5">
              <div className="mt-0.5 p-2 rounded-lg bg-destructive/15 shrink-0"><p.icon className="w-4 h-4 text-destructive/80" /></div>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ SOLUTION ═══════ */
function SolutionSection() {
  const items = [
    { icon: Users, label: "Gestion des élèves" },
    { icon: Calendar, label: "Planning & séances" },
    { icon: UserCheck, label: "Formateurs & véhicules" },
    { icon: FileText, label: "Devis & factures" },
    { icon: CreditCard, label: "Paiements & impayés" },
    { icon: Bell, label: "Rappels automatiques" },
    { icon: TrendingUp, label: "Rentabilité détaillée" },
  ];
  return (
    <section className="py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div {...fade()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">La solution</span>
          </motion.div>
          <motion.h2 {...fade(0.04)} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Tout votre pilotage dans un seul logiciel
          </motion.h2>
          <motion.p {...fade(0.08)} className="mt-3 text-muted-foreground">Remplacez vos outils éparpillés par une plateforme unifiée.</motion.p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {items.map((it, i) => (
            <motion.div key={i} {...fade(i * 0.04)} className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/40 bg-card text-sm font-medium text-foreground shadow-sm hover:border-primary/25 hover:shadow-md transition-all">
              <it.icon className="w-4 h-4 text-primary shrink-0" />
              {it.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ FEATURES ═══════ */
function FeaturesSection() {
  const features = [
    { icon: Users, title: "Gestion des élèves", desc: "Fiches complètes, suivi de progression, statut, historique et formules achetées." },
    { icon: Calendar, title: "Planning intelligent", desc: "Détection automatique de conflits, affectation formateur + véhicule, vue semaine et mois." },
    { icon: FileText, title: "Devis & factures", desc: "Numérotation automatique, conversion devis → facture en 1 clic, génération PDF." },
    { icon: CreditCard, title: "Suivi des paiements", desc: "Paiements partiels, reste à payer, détection instantanée des impayés." },
    { icon: TrendingUp, title: "Rentabilité réelle", desc: "Vue par élève, formateur et véhicule. Marge nette, tendances, sans tableur." },
    { icon: Smartphone, title: "Pensé pour le terrain", desc: "Interface mobile-first rapide. Utilisable entre deux séances, partout." },
  ];
  return (
    <section id="fonctionnalites" className="py-20 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Les fonctionnalités essentielles
          </motion.h2>
          <motion.p {...fade(0.05)} className="mt-3 text-muted-foreground">Chaque fonctionnalité répond à un besoin concret du terrain.</motion.p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div key={i} {...fade(i * 0.05)} className="rounded-2xl border border-border/40 bg-card p-6 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ DIFFERENTIATION ═══════ */
function DifferentiationSection() {
  const items = [
    { icon: PieChart, title: "Rentabilité par élève", desc: "Savez-vous combien chaque élève vous rapporte réellement ?" },
    { icon: UserCheck, title: "Rentabilité par formateur", desc: "Comparez le coût de chaque formateur avec le CA qu'il génère." },
    { icon: Car, title: "Rentabilité par véhicule", desc: "Identifiez les véhicules rentables et ceux qui plombent votre marge." },
    { icon: Receipt, title: "Détection des impayés", desc: "Détectez et relancez avant que les retards ne s'accumulent." },
    { icon: Clock, title: "Heures consommées", desc: "Heures achetées vs réalisées par élève, en un coup d'œil." },
    { icon: Target, title: "Créneaux perdus", desc: "Annulations et no-shows pour optimiser votre remplissage." },
  ];
  return (
    <section className="py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div {...fade()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Ce qui fait la différence</span>
          </motion.div>
          <motion.h2 {...fade(0.04)} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Plus qu'un agenda : un vrai outil de pilotage
          </motion.h2>
          <motion.p {...fade(0.08)} className="mt-3 text-muted-foreground">DriveFlow vous donne les indicateurs pour prendre les bonnes décisions business.</motion.p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {items.map((it, i) => (
            <motion.div key={i} {...fade(i * 0.05)} className="rounded-2xl border border-border/40 bg-card p-6 hover:border-primary/25 transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                <it.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{it.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ AUDIENCE ═══════ */
function AudienceSection() {
  const profiles = [
    { icon: UserCheck, title: "Formateur indépendant", desc: "Organisez vos séances, facturez proprement, suivez vos revenus sans comptable.", tag: "Solo" },
    { icon: Users, title: "Auto-école / Petit centre", desc: "Gérez formateurs et véhicules, gardez la visibilité sur chaque indicateur clé.", tag: "Équipe" },
    { icon: BarChart3, title: "Centre Taxi / VTC / VMDTR", desc: "Multi-activités, multi-sites : DriveFlow s'adapte à votre échelle.", tag: "Structure" },
  ];
  return (
    <section className="py-20 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Conçu pour les professionnels de la conduite
          </motion.h2>
          <motion.p {...fade(0.05)} className="mt-3 text-muted-foreground">Quel que soit votre profil, DriveFlow s'adapte à vos besoins.</motion.p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
          {profiles.map((p, i) => (
            <motion.div key={i} {...fade(i * 0.06)} className="rounded-2xl border border-border/40 bg-card p-6 text-center hover:border-primary/25 hover:shadow-lg transition-all duration-300">
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-primary/8 text-[10px] font-bold text-primary uppercase tracking-wider mb-4">{p.tag}</div>
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ PRICING ═══════ */
function PricingSection({ onCTA }: { onCTA: () => void }) {
  const plans = [
    {
      name: "Solo", price: "49", desc: "Formateur indépendant",
      features: ["1 formateur", "Gestion des élèves", "Planning", "Devis & factures", "Suivi des paiements", "Rentabilité de base"],
      highlighted: false,
    },
    {
      name: "Pro", price: "89", desc: "Petit centre de formation",
      features: ["Jusqu'à 5 formateurs", "Multi-véhicules", "Tout Solo +", "Rentabilité par formateur", "Rentabilité par véhicule", "Rappels automatiques"],
      highlighted: true,
    },
    {
      name: "Centre", price: "149", desc: "Structure organisée",
      features: ["Formateurs illimités", "Multi-activités", "Tout Pro +", "Rôles & permissions", "Journal d'activité", "Accompagnement dédié"],
      highlighted: false,
    },
  ];
  return (
    <section id="tarifs" className="py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Des offres claires, sans surprise
          </motion.h2>
          <motion.p {...fade(0.05)} className="mt-3 text-muted-foreground">Pas d'engagement caché. Choisissez le plan adapté à votre activité.</motion.p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto items-start">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              {...fade(i * 0.06)}
              className={`rounded-2xl border p-6 sm:p-7 flex flex-col relative ${
                p.highlighted
                  ? "border-primary/40 bg-card shadow-xl shadow-primary/8 ring-1 ring-primary/20 scale-[1.02]"
                  : "border-border/40 bg-card"
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-primary-foreground bg-primary px-4 py-1 rounded-full shadow-md">Recommandé</span>
              )}
              <h3 className="text-lg font-extrabold text-foreground">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5 mb-5">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-foreground tabular-nums">{p.price} €</span>
                <span className="text-sm text-muted-foreground font-medium">/ mois</span>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={onCTA}
                variant={p.highlighted ? "default" : "outline"}
                className={`w-full h-12 text-sm font-semibold ${p.highlighted ? "glow-primary" : ""}`}
              >
                Demander une démo
              </Button>
            </motion.div>
          ))}
        </div>
        <motion.p {...fade(0.25)} className="text-center text-xs text-muted-foreground/60 mt-8 font-medium">
          Accompagnement au paramétrage et à la prise en main inclus.
        </motion.p>
      </div>
    </section>
  );
}

/* ═══════ CREDIBILITY ═══════ */
function CredibilitySection() {
  const items = [
    { icon: Shield, title: "Données sécurisées", desc: "Hébergement européen, chiffrement, sauvegardes automatiques." },
    { icon: Smartphone, title: "Mobile-first", desc: "Conçu pour être utilisé entre deux séances, sur le terrain." },
    { icon: Zap, title: "Mises à jour continues", desc: "Nouvelles fonctionnalités chaque mois, guidées par vos retours." },
    { icon: Star, title: "Développé avec le terrain", desc: "Co-construit avec des formateurs et gérants de centres." },
  ];
  return (
    <section className="py-20 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Un produit fiable, pensé pour durer
          </motion.h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {items.map((t, i) => (
            <motion.div key={i} {...fade(i * 0.05)} className="rounded-2xl border border-border/40 bg-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5 text-sm">{t.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ FAQ ═══════ */
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
    <section id="faq" className="py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Questions fréquentes
          </motion.h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-2">
          {faqs.map((f, i) => (
            <motion.div key={i} {...fade(i * 0.03)} className="rounded-xl border border-border/40 bg-card overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-3" aria-expanded={openIdx === i}>
                <span className="text-sm font-semibold text-foreground">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${openIdx === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-5 pb-4"><p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════ FINAL CTA ═══════ */
function FinalCTA({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="section-dark py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center">
        <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary-foreground tracking-tight max-w-3xl mx-auto leading-tight">
          Prêt à piloter votre activité avec plus de clarté ?
        </motion.h2>
        <motion.p {...fade(0.06)} className="mt-5 text-primary-foreground/60 leading-relaxed max-w-xl mx-auto text-base sm:text-lg">
          Demandez une démonstration personnalisée. Découvrez en 15 minutes comment DriveFlow simplifie votre quotidien.
        </motion.p>
        <motion.div {...fade(0.12)} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={onCTA} className="text-base px-10 h-13 font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl">
            Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="ghost" onClick={onCTA} className="text-sm text-primary-foreground/60 hover:text-primary-foreground h-13 px-6">
            Rejoindre la bêta →
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════ FOOTER ═══════ */
function Footer() {
  return (
    <footer className="border-t border-border/30 py-12 bg-card/50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-xs font-extrabold text-primary-foreground">DF</span>
            </div>
            <span className="font-bold text-foreground">DriveFlow</span>
            <span className="text-xs text-muted-foreground/50 ml-1 font-medium">Gestion & Rentabilité</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#beta" className="hover:text-foreground transition-colors">Démo</a>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground/40 font-medium">
          © {new Date().getFullYear()} DriveFlow. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

/* ═══════ FORM MODAL ═══════ */
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

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const fieldClass = "bg-muted/40 border-border/40 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 h-11";
  const errorFor = (field: string) =>
    touched[field] && errors[field] ? <span className="text-xs text-destructive mt-1 block">{errors[field]}</span> : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl">
        <div className="sticky top-0 bg-card/98 backdrop-blur-xl px-6 py-5 border-b border-border/30 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Rejoindre la bêta DriveFlow</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Nous vous recontacterons sous 48h.</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-5"><Check className="w-7 h-7 text-success" /></div>
            <h3 className="text-lg font-extrabold text-foreground mb-2">Demande envoyée !</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">Merci pour votre intérêt. Notre équipe vous contactera très bientôt.</p>
            <Button variant="outline" onClick={onClose} className="h-11 px-6">Fermer</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nom <span className="text-destructive">*</span></label>
                <Input className={fieldClass} value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} onBlur={() => handleBlur("lastName")} placeholder="Dupont" />
                {errorFor("lastName")}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Prénom <span className="text-destructive">*</span></label>
                <Input className={fieldClass} value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} onBlur={() => handleBlur("firstName")} placeholder="Jean" />
                {errorFor("firstName")}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nom de la structure</label>
              <Input className={fieldClass} value={form.structureName} onChange={(e) => handleChange("structureName", e.target.value)} placeholder="Auto-école du Centre" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Type de structure <span className="text-destructive">*</span></label>
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
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Téléphone</label>
                <Input className={fieldClass} type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Email <span className="text-destructive">*</span></label>
                <Input className={fieldClass} type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")} placeholder="jean@exemple.fr" />
                {errorFor("email")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Formateurs</label>
                <Input className={fieldClass} type="number" min="1" value={form.instructorCount} onChange={(e) => handleChange("instructorCount", e.target.value)} placeholder="1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Véhicules</label>
                <Input className={fieldClass} type="number" min="1" value={form.vehicleCount} onChange={(e) => handleChange("vehicleCount", e.target.value)} placeholder="1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Message</label>
              <Textarea className={`${fieldClass} min-h-[80px] h-auto`} value={form.message} onChange={(e) => handleChange("message", e.target.value)} placeholder="Décrivez votre besoin…" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-semibold glow-primary">
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</span> : "Envoyer ma demande"}
            </Button>
            <p className="text-[11px] text-muted-foreground/50 text-center font-medium">Vos données sont traitées uniquement dans le cadre de cette demande.</p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════ MAIN ═══════ */
export default function LandingPage() {
  const [formOpen, setFormOpen] = useState(false);
  const openForm = () => setFormOpen(true);

  return (
    <>
      <Nav onCTA={openForm} />
      <main className="bg-background text-foreground">
        <Hero onCTA={openForm} />
        <SocialProofBar />
        <BenefitsSection />
        <ProblemSection />
        <SolutionSection />
        <DifferentiationSection />
        <FeaturesSection />
        <AudienceSection />
        <PricingSection onCTA={openForm} />
        <CredibilitySection />
        <FAQSection />
        <FinalCTA onCTA={openForm} />
        <Footer />
      </main>
      <BetaFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
