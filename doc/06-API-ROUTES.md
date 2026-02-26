# Spécifications des API Routes

Toutes les routes API sont dans `src/pages/api/`. Elles acceptent et retournent du JSON. L'authentification est vérifiée via un cookie de session.

## Auth

### POST /api/auth/login
```json
Request:  { "password": "..." }
Response: { "ok": true }  + Set-Cookie: session=...
```
Un seul compte admin. Le mot de passe est hashé en DB ou dans un .env.

### POST /api/auth/logout
```json
Response: { "ok": true }  + Clear-Cookie
```

## Posts

### GET /api/posts
```json
Response: [{ id, title, date, cat, time, excerpt, content, draft, visible, docProject, history: [...] }]
```
- Public : filtre `visible = true`, retourne `content` (pas draft)
- Admin : retourne tout, inclut draft

### POST /api/posts
```json
Request:  { title, date, cat, time, excerpt, content }
Response: { id, ...post }
```
Crée un nouveau post avec `visible: false`, `draft: null`.

### GET /api/posts/:id
### PUT /api/posts/:id
Met à jour les métadonnées (title, cat, date, time, excerpt, visible, docProject).

### DELETE /api/posts/:id
Supprime le post et son historique (cascade).

### PUT /api/posts/:id/draft
```json
Request:  { content: "markdown..." }
Response: { ok: true }
```
Sauvegarde le brouillon. Crée un commit dans post_history avec le contenu AVANT modification.

### POST /api/posts/:id/publish
```json
Response: { ok: true }
```
Copie `draft` dans `content`, met `draft` à null.

## Docs

### GET /api/docs
Query params optionnels : `?project=UniDash`
```json
Response: [{ id, project, section, title, content, draft, visible, sortOrder, history: [...] }]
```

### POST /api/docs
```json
Request:  { project, section, title, content }
Response: { id, ...doc }
```

### PUT /api/docs/:id
### DELETE /api/docs/:id

### PUT /api/docs/:id/draft
Même logique que posts.

### POST /api/docs/:id/publish
Même logique que posts.

### DELETE /api/docs/section
```json
Request: { project: "UniDash", section: "Architecture" }
```
Supprime toutes les docs de cette section dans ce projet.

## Portfolio

### GET /api/portfolio
```json
Response: { content: "mdx...", draft: "mdx..." | null, history: [...] }
```

### PUT /api/portfolio/draft
```json
Request: { content: "mdx..." }
```

### POST /api/portfolio/publish
Copie draft dans content.

## Settings

### GET /api/settings
```json
Response: { maintenance: false }
```

### PUT /api/settings
```json
Request: { maintenance: true }
```

## Middleware Auth

Toutes les routes `/api/*` sauf `/api/auth/login` et les GET publics nécessitent un cookie de session valide.

Les routes GET publics (`/api/posts`, `/api/docs`, `/api/portfolio`) :
- Sans auth : retournent uniquement les données publiées (content, visible=true)
- Avec auth admin : retournent tout (draft inclus, visible=false inclus)

## Codes d'erreur

- `401` : Non authentifié
- `403` : Pas admin
- `404` : Ressource non trouvée
- `422` : Données invalides
- `500` : Erreur serveur
