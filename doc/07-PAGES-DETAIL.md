# Détail de chaque page — Comportement exact

## Page Portfolio (`/`)

### Layout
- Max-width 1100px centré, padding 0 3rem
- Pas de sidebar, contenu linéaire vertical

### Sections (dans l'ordre)
1. **Hero** — Centré
   - Role en uppercase bleu, letterspacing 4px, 0.8rem
   - Nom en Playfair Display 6rem, bold, letterspacing -3px
   - Headline en Playfair 1.8rem italic, mots entre `*` en bleu italic
   - Bio en DM Sans 1.05rem, couleur secondary, max-width 560px centré

2. **Skills** — Row flex horizontal, wrap
   - Cards avec border-bottom 2px (line → blue au hover)
   - Nom en Playfair 1rem bold, détails en DM Sans 0.82rem tertiary
   - Flex 1 1 0, minWidth 160px, text-align center

3. **Projets** — Grid numérotée
   - Header : "Projets." (Playfair 2rem) + count à droite
   - Chaque projet : grid 60px / 1fr / auto
   - Colonne 1 : numéro "01" en Playfair 1.3rem italic, decorative → blue au hover
   - Colonne 2 : titre Playfair 1.5rem + description DM Sans + boutons liens
   - Colonne 3 : tags dans des pills border-radius 20px
   - Boutons liens : "Article →" et "Docs →" (si frontmatter a blog/docs)

4. **Stats** — Grid N colonnes
   - Valeur en Playfair 2.2rem blue bold
   - Label en DM Sans 0.75rem uppercase letterspacing 1px

5. **Corps MDX** — Rendu markdown standard

### Mode admin
- Bouton "Éditer" flottant en bas
- Barre draft/publish sous la nav si brouillon existe
- GitHistory accessible depuis cette barre

## Page Blog Liste (`/blog`)

### Layout
- Max-width 1100px, padding 6rem 3rem 8rem

### Header
- Flex row : titre "Journal." (Playfair 3rem) à gauche, SearchBar (260px) à droite
- Sous-titre "Notes techniques et retours d'expérience." DM Sans 1rem secondary

### Liste d'articles
- Filtrée par `visible = true` pour le public
- Filtrée en plus par la recherche (titre, excerpt, cat) côté client
- Chaque article :
  - Catégorie (DM Sans 0.78rem blue uppercase) · date (tertiary)
  - Titre (Playfair 2rem, white → blueHover au hover)
  - Excerpt (DM Sans 1rem secondary)
  - Temps de lecture + → (DM Sans 0.82rem tertiary)
  - Séparateur border-bottom entre chaque article
  - Clic → ouvre l'article

### Message vide
Si aucun résultat de recherche : "Aucun article trouvé pour "{query}"."

## Page Blog Article (`/blog/:slug`)

### Layout
- Max-width 1100px, padding 4rem 3rem 8rem

### Structure
1. Bouton "← Retour" (tertiary → blueHover au hover)
2. Meta : catégorie blue uppercase · date · temps de lecture
3. Titre (Playfair 2.8rem)
4. Excerpt (DM Sans 1.1rem italic secondary)
5. Bouton doc si `docProject` existe : "Documentation {projet} →"
6. TOC si h2 trouvés : boîte surface avec liste des h2 en blueHover
7. Contenu markdown rendu
8. Barre admin (si admin) : DraftBadge + Publier + GitHistory + Éditer

## Page Docs Sélecteur (`/docs`)

### Layout
- Max-width 1100px, padding 6rem 3rem 8rem
- N'utilise PAS le layout 100vh (scrollable normalement)

### Structure
1. Titre "Documentation." (Playfair 3rem)
2. Sous-titre (DM Sans 1rem secondary)
3. Barre de recherche globale (pleine largeur, position relative pour le dropdown)
4. Grille de projets : `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`
   - Card par projet : border + padding 1.5rem, border-radius 8px
   - Hover : border → blue 44%, background blue 8%
   - Nom du projet (Playfair 1.4rem)
   - Stats "{N} pages · {N} sections" (DM Sans 0.8rem tertiary)

### Dropdown recherche globale
- Apparaît sous la SearchBar en position absolute
- Background surface, border line, border-radius 6px, box-shadow
- Chaque résultat : Projet > Page > Section + aperçu de la ligne trouvée
- Clic → navigation vers le projet et la page

## Page Doc Reader (`/docs/:project/:page`)

### Layout CRITIQUE — 3 colonnes
```css
display: grid;
grid-template-columns: 250px 1fr 170px;
flex: 1;
overflow: hidden;
```
La page ENTIÈRE (hors nav) est en 100vh. Chaque colonne scroll indépendamment.

### Sidebar gauche (250px)
1. Bouton "← Tous les projets"
2. Nom du projet (Playfair 1.1rem)
3. SearchBar globale (avec dropdown résultats)
4. Sections et pages :
   - Section : Playfair 0.85rem, bold, marginBottom 0.5rem
   - Page : DM Sans 0.85rem, tertiary → blueHover quand active
   - Page active : border-left 2px blue, fontWeight 500

### Contenu central
1. Breadcrumb : Projet > Section > Page (DM Sans 0.8rem)
2. Titre (Playfair 2.5rem + point bleu)
3. Contenu markdown rendu
4. Barre admin (si admin) : DraftBadge + Publier + GitHistory + Éditer

### TOC droite (170px)
- Titre "SUR CETTE PAGE" (DM Sans 0.7rem uppercase letterspacing 1.5px)
- Liste des h2 de la page (0.85rem)
- Premier h2 : blueHover + border-left 1px blue
- Autres : tertiary

## Page Admin Blog (`/admin/blog`)

### Layout
- Max-width 1100px, padding 4rem 0 8rem

### Header
- "Admin Blog." (Playfair 2rem) + stats
- Bouton "+ Nouvel article" (background blue)

### Liste
- Chaque post :
  - Row 1 : catégorie + date + character count
  - Row 2 : titre (Playfair 1.15rem, white si visible, tertiary si masqué)
  - Row 3 : VisToggle + DraftBadge + Publier + spacer + GitHistory + Éditer + Supprimer
- Séparateur border-bottom entre chaque

## Page Admin Docs (`/admin/docs`)

### Layout
- Max-width 1100px

### Header
- "Admin Documentation." + stats du projet actif
- Bouton "+ Projet" (crée un projet avec une première page)

### Onglets projet
- Row de boutons, un par projet
- Projet actif : background blue 12%, border blue 44%, color blueHover
- Chaque onglet montre le count de pages

### Contenu par projet
- Bouton "+ Section" (avec input inline pour le nom)
- Chaque section :
  - Header : nom de section + boutons "+ Page" et "Supprimer section"
  - Liste de pages : titre + VisToggle + DraftBadge + Publier + GitHistory + Éditer + Supprimer

## Page Maintenance (`/maintenance`)

- Centré horizontal et vertical, flex column
- 🔧 emoji en 3rem
- "Maintenance en cours." (Playfair 2.5rem + point bleu)
- Texte explicatif (DM Sans 1.05rem secondary, max-width 480px)
