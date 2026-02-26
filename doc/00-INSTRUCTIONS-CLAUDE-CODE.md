# Instructions pour Claude Code — Portfolio Gabriel

## Ce que tu as entre les mains

Ce dossier contient la spécification complète d'un site portfolio/blog/documentation prototypé en React et à implémenter en Astro SSR + SQLite + Drizzle. Chaque fichier a un rôle précis :

| Fichier | Contenu |
|---------|---------|
| `01-ARCHITECTURE.md` | Stack technique, structure de fichiers, principes d'archi |
| `02-DATABASE.md` | Schéma Drizzle complet, tables, relations, seed data |
| `03-DESIGN-SYSTEM.md` | Charte graphique, couleurs, typo, composants visuels, thèmes |
| `04-FEATURES.md` | Specs fonctionnelles : maintenance, draft/publish, versioning, recherche, liens croisés |
| `05-BUGS-ET-LECONS.md` | Pièges à éviter absolument — bugs découverts pendant le prototypage |
| `06-API-ROUTES.md` | Toutes les routes API REST avec payloads |
| `07-PAGES-DETAIL.md` | Comportement exact de chaque page, pixel par pixel |
| `reference/design-3-editorial-v4.jsx` | **LE FICHIER DE RÉFÉRENCE** — prototype React complet qui fait foi |

## Comment utiliser ces fichiers

### Priorité de lecture
1. Lis d'abord `01-ARCHITECTURE.md` pour comprendre la big picture
2. Puis `03-DESIGN-SYSTEM.md` pour la charte graphique
3. Puis `04-FEATURES.md` pour les comportements
4. Puis `02-DATABASE.md` pour le schéma
5. Puis `06-API-ROUTES.md` pour les endpoints
6. Puis `07-PAGES-DETAIL.md` pour les détails de chaque page
7. **Lis `05-BUGS-ET-LECONS.md` AVANT de coder** — ça t'évitera de perdre du temps

### Le fichier JSX fait foi
En cas de doute sur TOUT aspect visuel ou comportemental, ouvre `reference/design-3-editorial-v4.jsx`. C'est un fichier React JSX unique de ~1300 lignes qui contient :
- Le système de thème complet (dark/light/auto)
- Le parser YAML/MDX custom
- Le renderer markdown
- La coloration syntaxique
- Tous les composants (Nav, Portfolio, Blog, Docs, Admin, Editor)
- Toutes les données de seed (portfolio MDX, posts, docs)
- Le système draft/publish complet
- Le mode maintenance
- La recherche globale docs
- Les liens croisés entre entités

### Ce qui change entre le proto et la prod

| Proto (JSX) | Prod (Astro) |
|-------------|-------------|
| State React en mémoire | SQLite + Drizzle |
| Parser YAML custom | Libraire YAML standard (js-yaml) |
| Renderer MD custom | marked/markdown-it + Shiki |
| Éditeur textarea custom | Vditor |
| SPA React (un seul fichier) | Pages Astro + Islands React |
| Auth simulée (toggle) | Vraie auth session cookie |
| Tout côté client | SSR + API routes + islands |

### Ce qui NE change PAS

- La charte graphique (couleurs, fonts, spacing) → identique
- Le comportement des features → identique
- La structure des données → identique (juste en DB au lieu de state)
- L'UX et les interactions → identiques

## Règles absolues

1. **Ne JAMAIS utiliser `transition: all`** — Lister les propriétés explicitement
2. **`width: 100%` dans tout parent flex** quand `margin: 0 auto` est utilisé
3. **Hooks React avant tout return** dans les islands
4. **Pas de globals window** pour le state
5. **Versionner** — Garder les anciennes versions des fichiers (ne jamais écraser)
6. **WCAG AA** — Toutes les couleurs texte doivent avoir 4.5:1 de contraste minimum
7. **Les données de seed du JSX sont canon** — Les copier exactement

## Ordre d'implémentation suggéré

1. Setup Astro + Drizzle + SQLite + schema + seed
2. Système de thème (CSS variables + island ThemeToggle)
3. Layout de base + Nav
4. Page Portfolio (rendu MDX serveur)
5. Page Blog liste + article
6. Pages Docs (sélecteur + reader 3 colonnes)
7. Auth (login simple)
8. API routes CRUD
9. Système draft/publish
10. Admin pages (blog + docs)
11. Mode maintenance
12. Recherche (blog client-side, docs server-side)
13. Liens croisés
14. Éditeur Vditor
15. GitHistory + versioning
16. Docker + deploy
