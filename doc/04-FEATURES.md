# Spécifications Fonctionnelles Détaillées

## 1. Mode Maintenance

### Comportement
- Toggle dans la nav admin (bouton "Maintenance")
- Quand actif : TOUTES les pages publiques affichent la page de maintenance
- L'admin connecté continue de naviguer normalement sur tout le site
- Bannière orange en haut du site rappelle à l'admin que le mode est actif
- Stocké en DB dans la table `settings` (clé `maintenance`, valeur `"true"/"false"`)

### Page de maintenance
- Centré verticalement et horizontalement
- Icône 🔧 grande
- Titre "Maintenance en cours." (avec point bleu)
- Texte "Le site est temporairement indisponible pour maintenance. Revenez bientôt !"

### Implémentation Astro
Middleware qui check `settings.maintenance === "true"` :
- Si oui et pas de cookie admin → redirect vers `/maintenance`
- Si oui et cookie admin → laisser passer + injecter bannière

## 2. Système Draft / Publish

### Principe
Chaque entité éditable (portfolio, posts, docs) a deux versions du contenu :
- `content` : version publiée, visible par le public
- `draft` : brouillon en cours, visible uniquement par l'admin

### Workflow
1. Admin ouvre l'éditeur → charge `draft || content` (priorité au brouillon s'il existe)
2. Admin sauvegarde → crée un commit dans `history` (snapshot du contenu AVANT modif) + écrit dans `draft`
3. Le public continue de voir `content` (inchangé)
4. Admin preview → voit le `draft` sur la page publique
5. Admin clique "Publier" → `content = draft`, `draft = null`
6. Le public voit maintenant la nouvelle version

### UI Admin

#### Badge Brouillon
- Badge orange "BROUILLON" affiché quand `draft !== null`
- Taille 0.65rem, uppercase, fond orange 10%, border orange 25%

#### Bouton Publier
- Bouton vert (couleur `green` du thème)
- Texte "Publier", font-weight 600
- Affiché uniquement quand un brouillon existe

#### Barre d'actions
En bas du contenu de chaque page (portfolio, blog article, doc page) quand admin :
```
[DraftBadge] [Publier]  ---- spacer ----  [GitHistory] [Éditer]
```

Pour le portfolio, cette barre est sous la nav (pas en bas).

### Cas particulier : Portfolio
- Le portfolio a sa propre barre draft/publish sous la nav
- Quand un brouillon existe : barre bleue avec badge, GitHistory, et bouton Publier
- Quand pas de brouillon mais historique : juste le GitHistory aligné à droite

## 3. Versioning (Git-style)

### Historique
Chaque sauvegarde crée un "commit" contenant :
- `date` : date formatée FR ("15 Déc 2025 10:30")
- `summary` : description ("Publication initiale", "Modification")
- `content` : snapshot du contenu AVANT la modification

### Composant GitHistory
- Bouton compact : icône ⎇ + nombre de commits
- Clic → dropdown avec liste scrollable des commits
- Chaque commit : date (bleu monospace) + summary
- Bouton "Restaurer" sur chaque commit sauf le plus récent
- "Restaurer" → confirm() puis met le contenu restauré en draft (pas en content direct)

### Affichage
- Dans les admin lists : badge commit count sur chaque item
- Dans les pages publiques (mode admin) : dans la barre d'actions en bas
- Dans la barre portfolio : dans la barre sous la nav

## 4. Visibilité (Visible/Draft)

### Principe
Indépendant du draft/publish. C'est un toggle on/off qui contrôle si l'item apparaît dans les listes publiques.

- `visible: true` → affiché au public (si pas en maintenance)
- `visible: false` → masqué du public, visible dans l'admin

### UI
- Checkbox verte (✓) quand visible, grise quand masqué
- Dans les admin lists, à gauche de la row d'actions
- Les pages publiques filtrent : `WHERE visible = true`

## 5. Recherche

### Recherche Blog
- Barre de recherche en haut à droite de la liste d'articles
- Filtre en temps réel (côté client) sur : titre, excerpt, catégorie
- Pas de recherche full-text côté serveur pour le blog (les données sont déjà chargées)

### Recherche Docs — Globale
- Barre de recherche présente sur :
  - Page sélection de projet docs
  - Sidebar du doc reader
- Recherche dans TOUTE la documentation (tous projets, toutes pages)
- Cherche dans : titre des pages + contenu complet de chaque page
- Résultats affichés dans un dropdown overlay :
  - Projet > Page > Section (heading h2 le plus proche)
  - Aperçu de la ligne trouvée (tronquée)
  - Clic → navigation directe vers le bon projet et la bonne page
- Minimum 2 caractères pour déclencher
- Maximum 15 résultats affichés
- Dédupliqués par combinaison doc.id + heading

### Implémentation
En production, la recherche docs devrait être côté serveur (API route) car le contenu de toutes les pages ne sera pas chargé côté client. Options :
- SQLite FTS5 (full-text search) pour la recherche doc
- Ou simple `LIKE %query%` sur content + title si le volume reste faible

## 6. Documentation par projet

### Structure
- Chaque page de doc appartient à UN projet
- Un projet contient des sections, chaque section contient des pages
- Les sections sont ordonnées selon `DOC_SECTIONS_ORDER`
- Les projets sont dérivés dynamiquement des docs existantes

### Navigation
1. `/docs` → grille de sélection de projets (cards avec nom, nb pages, nb sections)
2. Clic projet → vue reader 3 colonnes pour ce projet
3. Bouton "← Tous les projets" dans la sidebar pour revenir

### Admin Docs
- Onglets projet en haut de la page admin
- Le projet actif filtre les sections et pages affichées
- Bouton "+ Projet" pour créer un nouveau projet (crée une première page "Introduction" dans la section "Démarrage")
- Bouton "+ Section" par projet
- Bouton "+ Page" par section
- "Supprimer section" supprime la section ET toutes ses pages dans le projet actif uniquement

## 7. Liens croisés Portfolio <-> Blog <-> Docs

### Portfolio → Blog
Chaque projet du portfolio peut avoir un champ `blog` dans le YAML pointant vers un ID de post blog. Affiché comme bouton "Article →" sur la card du projet.

### Portfolio → Docs
Champ `docs` dans le YAML pointant vers un nom de projet doc. Bouton "Docs →".

### Blog → Docs
Champ `docProject` sur chaque post. Affiché comme bouton "Documentation {projet} →" sous l'excerpt de l'article.

### Navigation
Tous ces liens déclenchent une navigation vers la bonne page avec le bon contexte pré-sélectionné :
- "Docs →" → page Docs avec le projet pré-ouvert
- "Article →" → page Blog avec l'article pré-ouvert

## 8. Éditeur Markdown

### En production : Vditor
Remplace l'éditeur custom du prototype. Vditor offre :
- Mode split (éditeur + preview côté à côté)
- Mode WYSIWYG
- Toolbar avec boutons de formatage
- Support des blocs de code avec langage
- Preview temps réel

### Intégration
- Island React `client:only="react"` (jamais SSR, Vditor a besoin du DOM)
- Props : `content`, `onSave`, `onCancel`, `title`, `onTitleChange`
- Le save envoie le markdown brut à l'API

### Éditeur MDX (Portfolio)
- Même éditeur mais avec parsing YAML frontmatter
- Le panel gauche montre le YAML parsé en formulaire éditable
- Le panel droit est l'éditeur markdown pour le corps
- En mode formulaire : champs input pour chaque propriété du frontmatter
- Boutons pour ajouter/supprimer des items dans les arrays (skills, projects, stats)

## 9. Rendu Markdown

Le prototype implémente un renderer markdown custom. En production, utiliser :
- **Rendu serveur** : `marked` ou `markdown-it` pour le HTML côté Astro
- **Coloration syntaxique** : Shiki (intégré à Astro) pour les blocs de code
- **TOC** : Extraire les h2 du markdown pour la table des matières

Éléments rendus :
- Headings h1-h4 (styles Playfair Display)
- Paragraphes
- Listes à puces et numérotées
- Code inline (`backticks`)
- Blocs de code avec langue (```bash, ```env, ```js, ```yaml)
- Bold, italic
- Liens
- Ligne horizontale (---)
