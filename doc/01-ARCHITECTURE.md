# Architecture du Projet — Portfolio Gabriel

## Contexte

Ce document décrit l'architecture complète du site portfolio/blog/documentation de Gabriel, un SysAdmin/DevOps/Full-Stack développeur de 23 ans. Le site a été entièrement prototypé dans un fichier React JSX unique (`design-3-editorial-v4.jsx`) qui fait foi pour TOUT le comportement attendu. L'objectif est maintenant de transposer ce prototype en application Astro production-ready.

## Stack technique décidée

| Couche | Technologie | Raison |
|--------|-------------|--------|
| Framework | **Astro** (SSR mode) | Rendu serveur, islands architecture, performance |
| ORM | **Drizzle ORM** | Type-safe, léger, migrations faciles |
| Base de données | **SQLite** (via better-sqlite3) | Self-hosted, zero-config, pas de serveur DB séparé |
| Éditeur | **Vditor** (remplace le custom editor du proto) | Éditeur markdown WYSIWYG mature, split/preview |
| CMS | **MDX/YAML frontmatter** | Pour le portfolio uniquement |
| Auth | À implémenter (session-based) | Un seul admin, pas de multi-user public |
| Déploiement | Docker + Nginx reverse proxy | Cohérent avec l'infra existante de Gabriel |

## Pages du site

### Pages publiques
1. **Portfolio** (`/`) — Hero, skills, projets, stats, contenu MDX
2. **Blog** (`/blog`) — Liste d'articles avec recherche
3. **Blog Article** (`/blog/:slug`) — Article complet avec TOC
4. **Docs Sélecteur** (`/docs`) — Grille de sélection de projet
5. **Docs Reader** (`/docs/:project/:page`) — Layout 3 colonnes (sidebar, contenu, TOC)
6. **Page Maintenance** — Affichée quand le mode maintenance est actif

### Pages admin (protégées par auth)
7. **Admin Blog** (`/admin/blog`) — CRUD articles, visibilité, draft/publish, versioning
8. **Admin Docs** (`/admin/docs`) — CRUD par projet, sections, pages, draft/publish
9. **Admin Portfolio** — Édition MDX inline du portfolio (pas de page séparée, c'est un mode sur la page `/`)

## Structure de fichiers cible

```
portfolio/
├── astro.config.mjs
├── drizzle.config.ts
├── package.json
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── db/
│   │   ├── index.ts          # Connexion SQLite + Drizzle
│   │   ├── schema.ts         # Schéma Drizzle (posts, docs, settings)
│   │   └── migrations/       # Migrations auto-générées
│   ├── layouts/
│   │   ├── BaseLayout.astro  # HTML wrapper, fonts, meta
│   │   ├── AdminLayout.astro # Wrapper admin avec auth guard
│   │   └── DocsLayout.astro  # Layout 3 colonnes pour les docs
│   ├── components/
│   │   ├── Nav.astro         # Navigation principale
│   │   ├── ThemeToggle.tsx   # Island React — toggle dark/light/auto
│   │   ├── SearchBar.tsx     # Island React — recherche
│   │   ├── DocSearch.tsx     # Island React — recherche globale docs
│   │   ├── MarkdownRenderer.astro  # Rendu MD côté serveur
│   │   ├── DraftBadge.astro  # Badge "Brouillon"
│   │   ├── GitHistory.tsx    # Island React — dropdown historique
│   │   ├── VisToggle.tsx     # Island React — toggle visibilité
│   │   └── Editor.tsx        # Island React — wrapper Vditor
│   ├── pages/
│   │   ├── index.astro       # Portfolio
│   │   ├── blog/
│   │   │   ├── index.astro   # Liste blog
│   │   │   └── [slug].astro  # Article
│   │   ├── docs/
│   │   │   ├── index.astro   # Sélecteur projet
│   │   │   └── [project]/
│   │   │       └── [page].astro  # Page de doc
│   │   ├── admin/
│   │   │   ├── blog.astro
│   │   │   ├── docs.astro
│   │   │   └── login.astro
│   │   └── api/
│   │       ├── posts/
│   │       │   ├── index.ts      # GET all, POST new
│   │       │   ├── [id].ts       # GET, PUT, DELETE
│   │       │   ├── [id]/draft.ts # PUT draft
│   │       │   └── [id]/publish.ts # POST publish
│   │       ├── docs/
│   │       │   ├── index.ts
│   │       │   ├── [id].ts
│   │       │   ├── [id]/draft.ts
│   │       │   └── [id]/publish.ts
│   │       ├── portfolio/
│   │       │   ├── index.ts      # GET/PUT MDX
│   │       │   ├── draft.ts
│   │       │   └── publish.ts
│   │       ├── settings.ts       # GET/PUT (maintenance mode etc.)
│   │       └── auth/
│   │           ├── login.ts
│   │           └── logout.ts
│   ├── styles/
│   │   └── global.css        # Variables CSS du thème, reset, fonts
│   └── lib/
│       ├── auth.ts           # Session management
│       ├── markdown.ts       # Parsing MD pour rendu serveur
│       └── theme.ts          # Définition des thèmes (tokens)
├── public/
│   └── fonts/                # DM Sans, Playfair Display, JetBrains Mono
└── data/
    └── portfolio.db          # SQLite database file
```

## Principes d'architecture

### 1. Islands Architecture
Seuls les composants interactifs sont des islands React (hydratés côté client). Tout le reste est du HTML statique rendu par Astro côté serveur. Les islands sont :
- `ThemeToggle` (client:load)
- `SearchBar` (client:visible)
- `DocSearch` (client:visible)
- `GitHistory` (client:load)
- `VisToggle` (client:load)
- `Editor` (client:only="react" — jamais SSR)

### 2. API Routes
Toutes les mutations passent par des API routes Astro (`src/pages/api/`). Les pages admin font des `fetch()` vers ces routes. Pas de server actions — on reste simple avec REST.

### 3. Draft/Publish
Chaque entité a deux colonnes de contenu : `content` (publié, visible par tous) et `draft` (brouillon, visible uniquement par l'admin). "Sauvegarder" écrit dans `draft`. "Publier" copie `draft` dans `content` et met `draft` à null.

### 4. Versioning
Chaque sauvegarde crée un commit dans la table `history`. Un commit contient : date, summary, et le contenu AVANT la modification (pour pouvoir restaurer).

### 5. Mode maintenance
Un simple boolean dans la table `settings`. Quand activé, toutes les pages publiques redirigent vers une page maintenance. L'admin contourne cette restriction via son cookie de session.
