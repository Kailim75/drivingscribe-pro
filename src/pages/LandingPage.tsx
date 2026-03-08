import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, FileText, CreditCard, TrendingUp, Smartphone,
  ChevronDown, ChevronRight, ArrowRight, Check, X, Shield, Clock,
  Eye, AlertTriangle, BarChart3, Car, UserCheck, Receipt, Bell,
  Zap, Target, PieChart, Menu, ExternalLink,
} from "lucide-react";

import screenshotDashboard from "@/assets/screenshot-dashboard.jpg";
import screenshotPlanning from "@/assets/screenshot-planning.jpg";
import screenshotRentabilite from "@/assets/screenshot-rentabilite.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ──────────────── helpers ──────────────── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const SectionWrapper = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-20 md:py-28 ${className}`}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8">{children}</div>
  </section>
);

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
    <motion.h2 {...fade()} className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">{children}</motion.h2>
    {sub && <motion.p {...fade(0.1)} className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">{sub}</motion.p>}
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
          <span className="font-semibold text-foreground text-lg">DriveFlow</span>
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
        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setOpen(!open)}><Menu className="w-5 h-5" /></button>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-5 pb-4 space-y-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground">{l.label}</a>
          ))}
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => { setOpen(false); navigate("/connexion"); }}>Connexion</Button>
          <Button size="sm" className="w-full" onClick={() => { setOpen(false); onCTA(); }}>Demander une démo</Button>
        </div>
      )}
    </nav>
  );
}

/* ──────────────── S1 HERO ──────────────── */
function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fade()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Bêta fondatrice — Places limitées</span>
          </motion.div>

          <motion.h1 {...fade(0.05)} className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.15] text-foreground">
            Le logiciel de gestion et de rentabilité pour{" "}
            <span className="text-gradient">professionnels de la conduite</span>
          </motion.h1>

          <motion.p {...fade(0.1)} className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Centralisez vos heures, vos élèves, vos factures, vos paiements et votre rentabilité dans un seul outil simple, moderne et pensé pour le terrain.
          </motion.p>

          <motion.div {...fade(0.15)} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onCTA} className="w-full sm:w-auto text-base px-7 h-12 glow-primary">
              Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={onCTA} className="w-full sm:w-auto text-base px-7 h-12">
              Rejoindre la bêta
            </Button>
          </motion.div>

          <motion.p {...fade(0.2)} className="mt-5 text-xs text-muted-foreground">
            Conçu pour les formateurs indépendants, auto-écoles et centres Taxi / VTC / VMDTR.
          </motion.p>
        </div>

        {/* App screenshots carousel */}
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
    <SectionWrapper className="border-t border-border/30">
      <SectionTitle sub="Vous gérez encore vos séances sur un agenda, vos paiements dans un tableur et votre rentabilité… à l'aveugle.">
        Trop d'outils, trop de temps perdu, pas assez de visibilité
      </SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {problems.map((p, i) => (
          <motion.div key={i} {...fade(i * 0.06)} className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-5">
            <div className="mt-0.5 p-2 rounded-lg bg-destructive/10"><p.icon className="w-4 h-4 text-destructive" /></div>
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
    { icon: UserCheck, label: "Affectation formateur + véhicule" },
    { icon: FileText, label: "Devis & factures" },
    { icon: CreditCard, label: "Paiements & impayés" },
    { icon: Bell, label: "Rappels automatiques" },
    { icon: TrendingUp, label: "Rentabilité en temps réel" },
  ];
  return (
    <SectionWrapper>
      <SectionTitle sub="Un seul logiciel pour piloter toute votre activité au quotidien.">
        Tout votre pilotage dans un seul logiciel
      </SectionTitle>
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
        {items.map((it, i) => (
          <motion.div key={i} {...fade(i * 0.04)} className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border/50 bg-card/50 text-sm text-foreground">
            <it.icon className="w-4 h-4 text-primary" />
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
    { icon: UserCheck, title: "Rentabilité par formateur", desc: "Comparez le coût de chaque formateur avec le CA qu'il génère." },
    { icon: Car, title: "Rentabilité par véhicule", desc: "Identifiez les véhicules rentables et ceux qui coûtent trop cher." },
    { icon: Receipt, title: "Suivi des impayés", desc: "Détectez les retards de paiement avant qu'ils ne s'accumulent." },
    { icon: Clock, title: "Heures restantes", desc: "Visualisez en un clin d'œil les heures achetées vs réalisées." },
    { icon: Target, title: "Créneaux perdus", desc: "Identifiez les annulations et les no-shows pour optimiser votre planning." },
  ];
  return (
    <SectionWrapper className="border-t border-border/30">
      <SectionTitle sub="DriveFlow ne se contente pas de gérer vos rendez-vous. Il vous donne les indicateurs pour prendre les bonnes décisions.">
        Plus qu'un agenda : un vrai outil de pilotage
      </SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {items.map((it, i) => (
          <motion.div key={i} {...fade(i * 0.06)} className="rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 transition-colors">
            <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-4"><it.icon className="w-5 h-5 text-primary" /></div>
            <h3 className="font-semibold text-foreground mb-1.5">{it.title}</h3>
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
    { icon: Users, title: "Gestion des élèves", desc: "Fiches élèves complètes, suivi de progression, statut et historique." },
    { icon: Calendar, title: "Planning intelligent", desc: "Détection de conflits, affectation formateur et véhicule, vue terrain." },
    { icon: FileText, title: "Devis et factures", desc: "Numérotation automatique, conversion devis → facture, PDF et lien de partage." },
    { icon: CreditCard, title: "Suivi des règlements", desc: "Paiements partiels, reste à payer, détection des impayés en un coup d'œil." },
    { icon: TrendingUp, title: "Rentabilité réelle", desc: "Vue par élève, formateur et véhicule. Pas de tableur, pas de calcul à la main." },
    { icon: Smartphone, title: "Pensé pour le terrain", desc: "Interface mobile-first, rapide et fluide. Utilisable entre deux séances." },
  ];
  return (
    <SectionWrapper id="fonctionnalites">
      <SectionTitle sub="Chaque fonctionnalité est pensée pour les besoins réels des professionnels de la conduite.">
        Les fonctionnalités essentielles pour gagner du temps
      </SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {features.map((f, i) => (
          <motion.div key={i} {...fade(i * 0.06)} className="rounded-2xl border border-border/50 bg-card/50 p-6">
            <div className="p-2.5 rounded-xl bg-secondary w-fit mb-4"><f.icon className="w-5 h-5 text-primary" /></div>
            <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
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
    { icon: UserCheck, title: "Formateur indépendant", desc: "Un outil simple pour organiser vos séances, facturer proprement et suivre vos revenus." },
    { icon: Users, title: "Petit centre de formation", desc: "Gérez plusieurs formateurs et véhicules, gardez la visibilité sur chaque indicateur." },
    { icon: BarChart3, title: "Structure organisée", desc: "Multi-sites, multi-activités : DriveFlow s'adapte à votre échelle." },
  ];
  return (
    <SectionWrapper className="border-t border-border/30">
      <SectionTitle>Conçu pour les professionnels de la conduite</SectionTitle>
      <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {profiles.map((p, i) => (
          <motion.div key={i} {...fade(i * 0.08)} className="rounded-2xl border border-border/50 bg-card/50 p-6 text-center">
            <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4"><p.icon className="w-5 h-5 text-primary" /></div>
            <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
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
    "Visualiser rapidement les impayés",
    "Comprendre la rentabilité sans tableurs compliqués",
    "Structurer l'activité avec un outil professionnel",
  ];
  return (
    <SectionWrapper>
      <SectionTitle>Ce que DriveFlow vous apporte concrètement</SectionTitle>
      <div className="max-w-2xl mx-auto space-y-3">
        {benefits.map((b, i) => (
          <motion.div key={i} {...fade(i * 0.04)} className="flex items-center gap-3 py-3 px-4 rounded-xl border border-border/30 bg-card/30">
            <div className="p-1 rounded-full bg-success/10"><Check className="w-4 h-4 text-success" /></div>
            <span className="text-sm text-foreground">{b}</span>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

/* ──────────────── S8 TARIFS ──────────────── */
function PricingSection() {
  const plans = [
    {
      name: "Solo",
      price: "49",
      desc: "Pour les formateurs indépendants",
      features: ["1 formateur", "Gestion des élèves", "Planning", "Devis & factures", "Suivi des paiements", "Rentabilité de base"],
      highlighted: false,
    },
    {
      name: "Pro",
      price: "89",
      desc: "Pour les petits centres",
      features: ["Jusqu'à 5 formateurs", "Multi-véhicules", "Tout Solo +", "Rentabilité par formateur", "Rentabilité par véhicule", "Rappels automatiques"],
      highlighted: true,
    },
    {
      name: "Centre",
      price: "149",
      desc: "Pour les structures plus organisées",
      features: ["Formateurs illimités", "Multi-activités", "Tout Pro +", "Rôles & permissions", "Journal d'activité", "Accompagnement dédié"],
      highlighted: false,
    },
  ];
  return (
    <SectionWrapper id="tarifs" className="border-t border-border/30">
      <SectionTitle sub="Pas de surprise, pas d'engagement caché. Choisissez le plan adapté à votre activité.">
        Des offres simples et adaptées à votre structure
      </SectionTitle>
      <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {plans.map((p, i) => (
          <motion.div
            key={i}
            {...fade(i * 0.08)}
            className={`rounded-2xl border p-6 flex flex-col ${
              p.highlighted
                ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
                : "border-border/50 bg-card/50"
            }`}
          >
            {p.highlighted && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full w-fit mb-4">Populaire</span>
            )}
            <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{p.desc}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-foreground">{p.price} €</span>
              <span className="text-sm text-muted-foreground">/ mois</span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {p.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <motion.p {...fade(0.3)} className="text-center text-xs text-muted-foreground mt-8">
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
        <motion.h2 {...fade(0.05)} className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Rejoignez la bêta fondatrice
        </motion.h2>
        <motion.p {...fade(0.1)} className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Faites partie des premiers utilisateurs et contribuez à façonner le produit. Tarif préférentiel garanti.
        </motion.p>
        <motion.div {...fade(0.15)} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={onCTA} className="w-full sm:w-auto text-base px-7 h-12 glow-primary">
            Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={onCTA} className="w-full sm:w-auto text-base px-7 h-12">
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
    <SectionWrapper className="border-t border-border/30">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2 {...fade()} className="text-2xl sm:text-3xl font-bold text-foreground">
          Développé à partir des besoins réels du terrain
        </motion.h2>
        <motion.p {...fade(0.08)} className="mt-4 text-muted-foreground leading-relaxed max-w-xl mx-auto">
          DriveFlow est conçu en collaboration avec des formateurs indépendants et des gérants de centres de formation. Chaque fonctionnalité répond à un problème concret rencontré au quotidien.
        </motion.p>
        <motion.div {...fade(0.15)} className="mt-8 flex flex-wrap justify-center gap-4">
          {[
            { icon: Shield, text: "Données sécurisées" },
            { icon: Smartphone, text: "Mobile-first" },
            { icon: Zap, text: "Mises à jour continues" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/40 text-sm text-muted-foreground">
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
    { q: "À qui s'adresse DriveFlow ?", a: "DriveFlow s'adresse aux formateurs indépendants, aux auto-écoles, aux centres Taxi, VTC et VMDTR, ainsi qu'aux structures mixtes qui gèrent plusieurs activités de conduite." },
    { q: "L'application est-elle utilisable sur mobile ?", a: "Oui. DriveFlow est conçu mobile-first. L'interface est pensée pour être utilisée rapidement entre deux séances, sur smartphone ou tablette." },
    { q: "Peut-on gérer plusieurs formateurs et véhicules ?", a: "Oui. Selon votre plan, vous pouvez gérer plusieurs formateurs, véhicules et activités. Le planning détecte automatiquement les conflits de créneaux." },
    { q: "Comment fonctionne le suivi des paiements ?", a: "DriveFlow suit les paiements facture par facture, détecte les impayés et les paiements partiels, et vous alerte quand un règlement est en retard." },
    { q: "Comment est calculée la rentabilité ?", a: "La rentabilité est calculée à partir du chiffre d'affaires généré par élève, formateur ou véhicule, comparé aux coûts réels (heures, charges véhicule, etc.)." },
    { q: "Comment demander une démo ?", a: "Remplissez le formulaire en bas de cette page. Nous vous recontacterons sous 48 heures pour organiser une démonstration personnalisée." },
  ];
  return (
    <SectionWrapper id="faq" className="border-t border-border/30">
      <SectionTitle>Questions fréquentes</SectionTitle>
      <div className="max-w-2xl mx-auto space-y-2">
        {faqs.map((f, i) => (
          <motion.div key={i} {...fade(i * 0.04)} className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-foreground">{f.q}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openIdx === i ? "rotate-180" : ""}`} />
            </button>
            {openIdx === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            )}
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
        <motion.p {...fade(0.08)} className="mt-4 text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Demandez une démonstration et voyez comment simplifier la gestion de votre activité tout en gagnant en visibilité sur votre rentabilité.
        </motion.p>
        <motion.div {...fade(0.15)} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={onCTA} className="w-full sm:w-auto text-base px-7 h-12 glow-primary">
            Demander une démo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={onCTA} className="w-full sm:w-auto text-base px-7 h-12">
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.lastName.trim()) e.lastName = "Requis";
    if (!form.firstName.trim()) e.firstName = "Requis";
    if (!form.email.trim()) e.email = "Requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide";
    if (!form.structureType) e.structureType = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate submission — backend not connected yet
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast({ title: "Demande envoyée !", description: "Nous vous recontacterons sous 48 heures." });
  };

  if (!open) return null;

  const fieldClass = "bg-secondary/50 border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-6 py-5 border-b border-border/40 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">Rejoindre la bêta DriveFlow</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Nous vous recontacterons sous 48 heures.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <div className="p-3 rounded-full bg-success/10 w-fit mx-auto mb-4"><Check className="w-6 h-6 text-success" /></div>
            <h3 className="text-lg font-bold text-foreground mb-2">Demande envoyée !</h3>
            <p className="text-sm text-muted-foreground mb-6">Merci pour votre intérêt. Notre équipe vous contactera très bientôt.</p>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom *</label>
                <Input className={fieldClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Dupont" />
                {errors.lastName && <span className="text-xs text-destructive mt-1">{errors.lastName}</span>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prénom *</label>
                <Input className={fieldClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Jean" />
                {errors.firstName && <span className="text-xs text-destructive mt-1">{errors.firstName}</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom de la structure</label>
              <Input className={fieldClass} value={form.structureName} onChange={(e) => setForm({ ...form, structureName: e.target.value })} placeholder="Auto-école du Centre" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de structure *</label>
              <Select value={form.structureType} onValueChange={(v) => setForm({ ...form, structureType: v })}>
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
              {errors.structureType && <span className="text-xs text-destructive mt-1">{errors.structureType}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Téléphone</label>
                <Input className={fieldClass} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email *</label>
                <Input className={fieldClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jean@exemple.fr" />
                {errors.email && <span className="text-xs text-destructive mt-1">{errors.email}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nombre de formateurs</label>
                <Input className={fieldClass} type="number" min="1" value={form.instructorCount} onChange={(e) => setForm({ ...form, instructorCount: e.target.value })} placeholder="1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nombre de véhicules</label>
                <Input className={fieldClass} type="number" min="1" value={form.vehicleCount} onChange={(e) => setForm({ ...form, vehicleCount: e.target.value })} placeholder="1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
              <Textarea className={`${fieldClass} min-h-[80px]`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Décrivez votre besoin…" />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-sm">
              {loading ? "Envoi en cours…" : "Envoyer ma demande"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">Vos données sont traitées uniquement dans le cadre de cette demande.</p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

/* ──────────────── S13 FOOTER ──────────────── */
function Footer() {
  return (
    <footer className="border-t border-border/30 py-12">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">DF</span>
            </div>
            <span className="font-semibold text-foreground">DriveFlow</span>
            <span className="text-xs text-muted-foreground ml-1">Gestion & Rentabilité</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#beta" className="hover:text-foreground transition-colors">Démo</a>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground">
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
        <PricingSection />
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
