# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pre-implementation portfolio/blog/documentation site for Gabriel (SysAdmin/DevOps/Full-Stack). The complete spec lives in `doc/` and the canonical prototype is `doc/reference/design-3-editorial-v4.jsx` (~1300 lines of React). The goal is to transpose this prototype into an Astro SSR production app.

## Target Stack

- **Astro** (SSR mode) with React islands for interactivity only
- **Drizzle ORM** + **SQLite** (better-sqlite3)
- **Vditor** for markdown editing (replaces the custom textarea editor from prototype)
- **marked/markdown-it** + **Shiki** for server-side markdown rendering
- **js-yaml** for YAML parsing (replaces custom parser from prototype)
- Docker + Nginx for deployment

## Expected Commands (once scaffolded)

```bash
npm run dev          # astro dev
npm run build        # astro build
npx drizzle-kit generate   # generate DB migrations
npx drizzle-kit migrate    # run migrations
npm run seed         # seed DB from canonical data in JSX reference
```

## Spec Reading Order

1. `doc/01-ARCHITECTURE.md` — stack, file structure, architecture principles
2. `doc/03-DESIGN-SYSTEM.md` — colors, typography, layout, component specs
3. `doc/04-FEATURES.md` — maintenance, draft/publish, versioning, search, cross-links
4. `doc/02-DATABASE.md` — Drizzle schema, tables, seed data
5. `doc/06-API-ROUTES.md` — REST endpoints with payloads
6. `doc/07-PAGES-DETAIL.md` — per-page behavior
7. `doc/05-BUGS-ET-LECONS.md` — **read before writing any code**

In case of doubt on any visual or behavioral aspect, `doc/reference/design-3-editorial-v4.jsx` is the single source of truth.

## Implementation Order

1. Astro + Drizzle + SQLite + schema + seed
2. Theme system (CSS variables + ThemeToggle island)
3. Base layout + Nav
4. Portfolio page (server-rendered MDX)
5. Blog list + article pages
6. Docs pages (project selector + 3-column reader)
7. Auth (session-based cookie, single admin)
8. API routes CRUD
9. Draft/publish system
10. Admin pages (blog + docs)
11. Maintenance mode
12. Search (blog: client-side, docs: server-side)
13. Cross-links between entities
14. Vditor editor integration
15. GitHistory + versioning
16. Docker + deploy

## Architecture

### Islands Architecture
Only interactive components are React islands. Everything else is Astro SSR HTML:
- `ThemeToggle` (`client:load`) — dark/light/auto cycle
- `SearchBar` (`client:visible`) — blog filtering
- `DocSearch` (`client:visible`) — full-text docs search dropdown
- `GitHistory` (`client:load`) — version history dropdown
- `VisToggle` (`client:load`) — visibility toggle
- `Editor` (`client:only="react"`) — Vditor wrapper, never SSR'd

### API-first Mutations
All mutations go through REST API routes in `src/pages/api/`. Admin pages use `fetch()`. No server actions.

### Draft/Publish
Each entity has `content` (published) and `draft` (WIP) columns. Save writes to `draft`. Publish copies `draft` → `content` and nulls `draft`.

### Versioning
Each save creates a row in the `*_history` table with the content BEFORE the edit (for restore). Fields: date, summary, content.

### Database Tables
`posts`, `post_history`, `docs`, `doc_history`, `portfolio`, `portfolio_history`, `settings`

### Cross-links
Portfolio YAML frontmatter has `blog:` and `docs:` keys pointing to post slugs and project names. Blog posts have `docProject` linking to a docs project.

## Absolute Rules

1. **Never use `transition: all`** — always list properties explicitly: `transition: color 0.2s, background 0.2s, border-color 0.2s`
2. **Always `width: 100%`** on any element using `max-width` + `margin: 0 auto` inside a flex column parent
3. **All React hooks before any `return`** — no hooks after conditional returns
4. **No `window.*` globals for state** — use React hooks exclusively
5. **Use `useRef` + `Object.assign` for hover styles** — never `useState` (causes re-render flash)
6. **WCAG AA minimum** — all text must have ≥4.5:1 contrast ratio on both dark and light backgrounds
7. **Seed data from the JSX prototype is canonical** — copy it exactly
8. **Docs layout**: CSS grid `250px 1fr 170px`, each column independently scrollable, full `100vh`
9. **Max content width**: `1100px`, `margin: 0 auto`, `padding: 0 3rem`, always with `width: 100%`

## Design System Key Values

- **Fonts**: Playfair Display (headings/numbers), DM Sans (body/UI), JetBrains Mono (code)
- **Dark theme** (default): bg `#0c0c12`, accent `#3b82f6`
- **Light theme**: bg `#f0f0f4`, accent `#2563eb`
