# Audit drivingscribe-pro

Date: 2026-06-18  
Branche: `audit/codebase-review`  
Depot audite: `Kailim75/drivingscribe-pro`

## 1. Inventaire

### Stack et versions

- Application SPA React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui.
- Routage: `react-router-dom` v6, routes declarees dans `src/App.tsx`.
- Data fetching: `@tanstack/react-query`.
- Backend: Supabase, client genere dans `src/integrations/supabase/client.ts`, types dans `src/integrations/supabase/types.ts`.
- Tests: Vitest + Testing Library, 2 fichiers de tests (`src/test/example.test.ts`, `src/test/validations.test.ts`).
- CI: aucun dossier `.github` detecte.
- Documentation: README Lovable generique, pas de documentation technique projet avant cet audit.

### Organisation

- `src/pages`: pages applicatives (`Dashboard`, `Students`, `Planning`, `Invoicing`, `Payments`, `SettingsPage`, etc.).
- `src/components`: composants metier, layout, UI shadcn et sous-domaines (`finance`, `invoicing`, `planning`, `students`, `vehicles`).
- `src/hooks`: acces Supabase et logique metier par domaine (`useStudents`, `useLessons`, `useInvoices`, etc.).
- `src/contexts`: `AuthContext` et `OrgContext`.
- `src/lib`: validations, exports, seed demo, labels, utilitaires.
- `supabase/migrations`: 25 migrations SQL.
- `supabase/functions`: 5 Edge Functions (`auto-reminders`, `generate-invoice-pdf`, `public-invoice`, `receive-student-webhook`, `suggest-slots`).

### Routing et navigation

- Routes publiques: `/`, `/connexion`, `/onboarding`, `/p/facture`, `/admin`, `/suspendu`.
- Routes protegees par `ProtectedRoute`: tableau de bord, eleves, formateurs, vehicules, planning, offres, facturation, paiements, depenses, rentabilite, documents, rappels, import, journal, parametres, portail formateur.
- Point sensible: `/admin` n'est pas enveloppee dans `ProtectedRoute`; le composant tente ensuite un RPC admin, mais la protection route/role n'est pas explicite cote UI.

### Supabase et environnement

- Variables front attendues: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`.
- `.env` etait suivi par Git; correction appliquee: ajout `.env.example`, `.env` ignore, retrait de `.env` de l'index.
- Les migrations activent RLS sur les tables principales et utilisent des policies par organisation/role.
- Plusieurs Edge Functions utilisent `SUPABASE_SERVICE_ROLE_KEY`; c'est acceptable uniquement cote Edge Function, jamais cote front.

### Baseline commandes

- Avant installation: `npm ci` echouait car `package-lock.json` n'etait pas synchronise avec `package.json`.
- Apres correction lockfile: `npm run build` passe, avec avertissement CSS `@import` et bundle JS de 1,87 MB.
- `npm test` passe: 17 tests.
- `npm ci` passe apres correction du lockfile.
- `npm run lint` echoue encore: 215 erreurs et 21 warnings apres corrections ciblees, majoritairement `@typescript-eslint/no-explicit-any`.
- `npm audit fix` a reduit les vulnerabilites de 16 a 2. Les restantes demandent `npm audit fix --force` et un upgrade majeur de Vite.

## 2. Audit multi-axes

### Architecture et organisation

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `src/App.tsx:63` | Elevee | `/admin` est route publique; UX bloquee si non connecte et protection front non explicite. | Ajouter une route protegee admin dediee avec verification de role super-admin. |
| `src/App.tsx:1-31` | Moyenne | Toutes les pages lourdes sont importees statiquement; bundle initial tres gros. | Passer les pages principales en `React.lazy` avec `Suspense`. |
| `src/pages/*`, `src/components/*` | Moyenne | Pages volumineuses avec logique data/UI melangee. | Extraire vues, hooks et types par domaine progressivement. |

### Qualite code et TypeScript

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `tsconfig.app.json:17`, `tsconfig.json:4-8` | Elevee | `strict` et `noImplicitAny` desactives; erreurs runtime masquables. | Activer strict par paliers apres reduction des `any`. |
| Nombreux fichiers | Elevee | Lint bloque par 216 erreurs, surtout `any`. | Introduire des types domaine depuis `Database["public"]["Tables"]`. |
| `src/pages/Payments.tsx:207` | Elevee | Hook/utilitaire appele dans le rendu de table; risque d'ordre d'appel instable. | Corrige: pagination calculee au niveau composant. |
| `src/components/students/BulkAssignPayerDialog.tsx:36` | Moyenne | Expression ternaire a effet de bord, signalee par ESLint. | Corrige: `if/else` explicite. |

### Securite

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `supabase/functions/generate-invoice-pdf/index.ts:34-49` | Critique | Avant correction, un utilisateur authentifie pouvait demander un PDF par UUID via service role sans controle RLS explicite. | Corrige: lecture invoice/org via client authentifie, donc RLS appliquee. |
| `supabase/functions/auto-reminders/index.ts:14-30` | Critique | Function exposee `verify_jwt=false` utilisant service role; n'importe qui pouvait declencher des relances. | Corrige: secret `AUTO_REMINDERS_SECRET` requis via header `x-cron-secret`. |
| `supabase/functions/public-invoice/index.ts:22-31` | Elevee | Facture publique accessible par UUID seul. | Validation UUID ajoutee; backlog: ajouter token public aleatoire par facture. |
| `supabase/functions/receive-student-webhook/index.ts:61-69` | Elevee | Logs contenaient un extrait du payload, potentiellement PII. | Corrige: log taille uniquement + limite de payload. |
| `.env` | Elevee | Fichier env suivi par Git. | Corrige: `.env.example`, `.gitignore`, retrait de l'index. |

### Performance et bundle

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| Build Vite | Moyenne | Bundle JS initial: ~1,87 MB minifie, ~509 kB gzip. | Code splitting par routes et charts lourds (`recharts`, `framer-motion`). |
| `src/index.css:5` | Faible | `@import` apres Tailwind declenche un warning Vite CSS. | Deplacer l'import avant les directives Tailwind ou auto-heberger les fonts. |
| Hooks/pages dashboard | Moyenne | Calculs repetes par filtres/reductions dans le render. | Memoiser les aggregats les plus couteux. |

### SEO et indexabilite

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `index.html:6-10` | Moyenne | Meta globales uniquement; pas de meta par page ni canonical. | Ajouter gestion SEO par route publique. |
| SPA Vite | Moyenne | Contenu public rendu cote client, indexabilite limitee. | Pre-render/SSG pour landing et pages publiques. |
| `public/robots.txt` | Faible | Autorise tout mais pas de sitemap declare. | Ajouter `Sitemap:` et generer `sitemap.xml` si pages publiques stables. |

### Accessibilite

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| Plusieurs pages | Moyenne | Nombreux boutons icone ou boutons custom sans libelles ARIA systematiques. | Ajouter `aria-label` aux actions icon-only. |
| Formulaires custom | Moyenne | Certains inputs utilisent des labels visuels non associes. | Preferer `Label htmlFor` + `id` ou composants shadcn form. |

### Base de donnees et acces data

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `supabase/migrations/*` | Moyenne | RLS presente sur les tables principales; verification live impossible sans DB distante. | Ajouter tests SQL/RLS ou checklist Supabase CLI. |
| `src/hooks/*` | Moyenne | Requetes Supabase dispersees par hooks et composants. | Centraliser types/queries critiques et erreurs. |
| `public-invoice` | Elevee | Acces public sans token metier dedie. | Migration future: `public_access_token` + expiration/revocation. |

### Dependances et build

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `package-lock.json` | Elevee | `npm ci` impossible avant correction. | Corrige: lockfile regenere. |
| `npm audit` | Elevee | 16 vulnerabilites initiales, 2 restantes apres fix. | Planifier migration Vite majeure/testee. |
| `package.json` | Faible | Nom package generique Lovable. | Renommer pour clarte interne. |

### Tests

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `src/test/*` | Moyenne | Seulement validations et test exemple. | Ajouter tests auth/routing, paiements, facturation, Edge Functions. |
| CI absent | Moyenne | Build/lint/tests non gates en PR. | Ajouter GitHub Actions apres stabilisation lint. |

### UX/UI et marque

| Fichier | Gravite | Impact | Recommandation |
| --- | --- | --- | --- |
| `src/index.css` | Faible | Identite visuelle coherente forest/premium; pas de changement visuel applique. | Conserver tokens existants. |
| `SuperAdminPage` | Moyenne | Non connecte sur `/admin` peut rester en chargement. | Rediriger proprement vers `/connexion` et proteger par role. |

## 3. Priorisation

| Axe | Gravite | Effort | Impact |
| --- | --- | --- | --- |
| Edge Functions service role | Critique | S | Fort |
| `.env` suivi et lockfile casse | Elevee | S | Fort |
| Admin route/role | Elevee | M | Fort |
| Lint/TypeScript massif | Elevee | L | Fort |
| Dependances Vite/esbuild restantes | Elevee | M | Moyen/Fort |
| Bundle initial | Moyenne | M | Moyen |
| SEO SPA | Moyenne | M | Moyen |
| Accessibilite formulaires/actions | Moyenne | M | Moyen |
| Tests/CI | Moyenne | M | Fort |

Ordre recommande: securite Edge Functions et secrets, reproductibilite, route admin, tests critiques, dette TypeScript/lint, performance bundle, SEO/a11y.

## 4. Corrections appliquees

- `package-lock.json`: synchronisation avec `package.json`; `npm ci` est de nouveau possible.
- `npm audit fix`: vulnerabilites reduites de 16 a 2 sans upgrade majeur force.
- `.gitignore` + `.env.example` + retrait de `.env` de l'index Git.
- `generate-invoice-pdf`: suppression de l'usage service-role pour lire la facture et l'organisation; RLS appliquee via le JWT utilisateur.
- `auto-reminders`: ajout d'un secret d'execution `AUTO_REMINDERS_SECRET` requis dans `x-cron-secret`.
- `receive-student-webhook`: suppression du log de payload PII, limite de taille et limite de batch.
- `public-invoice`: validation du format UUID avant requete service-role.
- `Payments.tsx`: correction de l'appel `usePagination` dans le rendu.
- `BulkAssignPayerDialog`, `command.tsx`, `textarea.tsx`: petites corrections lint ciblees.

## 5. Backlog residuel

- P0: configurer `AUTO_REMINDERS_SECRET` dans Supabase et dans le scheduler qui appelle `auto-reminders`.
- P0: proteger `/admin` par un composant `AdminRoute` verifiant un role super-admin, pas seulement un RPC.
- P1: ajouter un token public non devinable pour `/p/facture` au lieu d'un acces par UUID seul.
- P1: migrer Vite vers une version non vulnerable, avec campagne de regression front.
- P1: reduire les `any` par domaine et faire passer `npm run lint`.
- P1: ajouter CI build/test/audit; activer lint en warning gate pendant la phase de remediation.
- P2: lazy-load des routes et charts pour reduire le bundle initial.
- P2: corriger `src/index.css` pour placer `@import` avant Tailwind ou auto-heberger les fonts.
- P2: ajouter meta par route publique, canonical, sitemap et strategie de pre-render.
- P2: renforcer a11y sur boutons icon-only et formulaires custom.

## 6. Verification

- `npm run build`: OK. Warnings restants: import CSS et bundle > 500 kB.
- `npm test`: OK, 17 tests.
- `npm run lint`: KO, 215 erreurs et 21 warnings restants, majoritairement dette `any` preexistante.
- `npm audit --audit-level=moderate`: KO apres fix, 2 vulnerabilites restantes liees a Vite/esbuild et necessitant un upgrade majeur force.
