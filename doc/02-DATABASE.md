# Schéma de Base de Données — Drizzle + SQLite

## Vue d'ensemble

La base SQLite contient 4 tables principales + 1 table settings. Tout le CMS est dans la DB sauf le portfolio MDX initial (seed).

## Tables

### `posts` — Articles de blog

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),                    // slug unique ex: "docker-compose-quit"
  title: text("title").notNull(),
  date: text("date").notNull(),                    // Format affiché: "15 Décembre 2025"
  cat: text("cat").notNull(),                      // Catégorie: "DevOps", "Sysadmin", "Dev"
  time: text("time").notNull(),                    // Temps de lecture: "8 min de lecture"
  excerpt: text("excerpt").notNull(),              // Résumé court affiché dans la liste
  content: text("content").notNull(),              // Markdown publié (ce que le public voit)
  draft: text("draft"),                            // Brouillon markdown (null = pas de brouillon)
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  docProject: text("doc_project"),                 // Lien vers un projet de doc (ex: "IsolApp")
  createdAt: text("created_at").notNull(),         // ISO datetime
  updatedAt: text("updated_at").notNull(),         // ISO datetime
});
```

### `post_history` — Historique des commits blog

```typescript
export const postHistory = sqliteTable("post_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  date: text("date").notNull(),                    // Format affiché: "15 Déc 2025 10:30"
  summary: text("summary").notNull(),              // "Publication initiale", "Modification"
  content: text("content").notNull(),              // Snapshot du contenu AVANT la modification
  createdAt: text("created_at").notNull(),
});
```

### `docs` — Pages de documentation

```typescript
export const docs = sqliteTable("docs", {
  id: text("id").primaryKey(),                     // slug unique ex: "ud-installation"
  project: text("project").notNull(),              // Nom du projet: "UniDash", "AstralEmu"
  section: text("section").notNull(),              // Section: "Démarrage", "Architecture"
  title: text("title").notNull(),
  content: text("content").notNull(),              // Markdown publié
  draft: text("draft"),                            // Brouillon (null = pas de brouillon)
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
```

### `doc_history` — Historique des commits docs

```typescript
export const docHistory = sqliteTable("doc_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  docId: text("doc_id").notNull().references(() => docs.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});
```

### `portfolio` — Contenu MDX du portfolio (une seule ligne)

```typescript
export const portfolio = sqliteTable("portfolio", {
  id: integer("id").primaryKey().default(1),       // Toujours 1 — single row
  content: text("content").notNull(),              // MDX complet publié
  draft: text("draft"),                            // MDX brouillon
  updatedAt: text("updated_at").notNull(),
});
```

### `portfolio_history` — Historique portfolio

```typescript
export const portfolioHistory = sqliteTable("portfolio_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});
```

### `settings` — Configuration globale

```typescript
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
```

Clés attendues dans settings :
- `maintenance` : `"true"` ou `"false"`

## Sections de documentation

Ordre des sections dans la sidebar :

```typescript
export const DOC_SECTIONS_ORDER = [
  "Démarrage",
  "Architecture", 
  "API Reference",
  "Guides avancés",
  "Personnalisation",
  "Authentification",
];
```

Sections absentes de cette liste : affichées après, dans l'ordre d'apparition.

## Projets docs

Dérivés dynamiquement : `SELECT DISTINCT project FROM docs WHERE visible = 1`.

Projets initiaux (seed) : UniDash (12p), AstralEmu (4p), Centrarr (3p), IsolApp (3p).

## Relations / Liens croisés

### Portfolio -> Blog / Docs (dans le frontmatter YAML)
```yaml
projects:
  - title: IsolApp
    blog: docker-compose-quit    # ID d'un post
    docs: IsolApp                # Nom d'un projet doc
```

### Blog -> Docs (champ docProject sur chaque post)
```
docProject: "Centrarr"   -> lien vers /docs/Centrarr
docProject: null          -> pas de lien
```

## Seed Data

Le fichier `design-3-editorial-v4.jsx` contient les données de seed complètes :
- `defaultPortfolioMDX` — MDX complet avec frontmatter
- `defaultPosts` — 3 articles
- `defaultDocs` — 22 pages sur 4 projets

**Copier exactement ces données dans le script de seed.**
