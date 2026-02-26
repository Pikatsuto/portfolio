# Charte Graphique & Design System

## Direction artistique

Le design choisi est **éditorial/magazine** (Design 3 sur 5 propositions testées). Inspiré des publications comme Monocle, avec une typographie serif/sans forte et des espaces généreux. Rejeté : néo-brutalisme (trop agressif), glassmorphism (trop générique), terminal (trop niche), luxury minimal (trop froid).

## Typographie

| Usage | Font | Poids | Taille |
|-------|------|-------|--------|
| Titres, headings, numéros projets | Playfair Display (serif) | 400, 600, 700 + italic | 1rem - 6rem |
| Corps, UI, boutons, meta | DM Sans | 400, 500, 600, 700 | 0.7rem - 1.1rem |
| Code, monospace, counts | JetBrains Mono | 400, 700 | 0.68rem - 0.95rem |

Import Google Fonts :
```
https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap
```

## Palette de couleurs — WCAG AA conforme

### Dark Theme (défaut)

```css
:root[data-theme="dark"] {
  --bg: #0c0c12;              /* Fond principal — pas pur noir, adouci */
  --surface: #121218;          /* Surfaces surélevées (cards, inputs) */
  --surface-alt: #16161e;      /* Surface alternative */
  --white: #e8e8ec;            /* Texte principal — pas pur blanc, adouci */
  --body: #c8c8cc;             /* Corps de texte */
  --secondary: #9a9aa0;        /* Texte secondaire (excerpts, bios) */
  --tertiary: #888890;         /* Meta-info, timestamps, labels */
  --blue: #3b82f6;             /* Accent principal */
  --blue-hover: #60a5fa;       /* Accent hover / liens actifs */
  --decorative: #6e6e78;       /* Éléments décoratifs (numéros) */
  --line: #1e1e26;             /* Bordures, séparateurs */
  --code-bg: #101016;          /* Fond des blocs de code */
  --green: #34d399;            /* Succès, publish, visible */
  --red: #f87171;              /* Danger, suppression */
  --nav-bg: rgba(12,12,18,0.92);  /* Nav avec backdrop-filter blur */
}
```

### Light Theme

```css
:root[data-theme="light"] {
  --bg: #f0f0f4;
  --surface: #f8f8fa;
  --surface-alt: #eaeaef;
  --white: #1a1a24;            /* Texte principal (foncé sur clair) */
  --body: #3a3a44;
  --secondary: #5a5a66;
  --tertiary: #72727e;
  --blue: #2563eb;
  --blue-hover: #1d4ed8;
  --decorative: #a0a0ac;
  --line: #dcdce2;
  --code-bg: #e8e8ee;
  --green: #059669;
  --red: #dc2626;
  --nav-bg: rgba(240,240,244,0.92);
}
```

### Couleurs syntaxe — WCAG AA vérifiées

**Dark** (sur code-bg #101016) :
- Pink `#f472b6` (7.2:1) — commandes bash, keywords
- Purple `#e879f9` (7.7:1) — flags, italic
- Green `#34d399` (9.9:1) — strings, valeurs
- Yellow `#fbbf24` (11.4:1) — nombres, bold

**Light** (sur code-bg #e8e8ee) :
- Pink `#be185d` (4.9:1) — commandes
- Purple `#7e22ce` (5.7:1) — flags
- Green `#065f46` (6.3:1) — strings
- Yellow (orange) `#92400e` (5.8:1) — nombres

## Thème — Comportement auto/manual

Le système de thème suit le `prefers-color-scheme` du système en mode **auto** par défaut :
- Clic sur le toggle → passe en mode **manuel** (verrouillé sur dark ou light)
- Double-clic sur le toggle → retour en mode **auto** (re-sync avec le système)
- L'icône du toggle a un border bleu subtil quand en mode auto
- Le listener `matchMedia("(prefers-color-scheme: light)")` est actif uniquement quand `auto = true`
- Le `useEffect` dépend de `[auto]` pour recréer le listener quand l'état change

**IMPORTANT** : NE PAS utiliser `window._themeManuallySet` ou des globals. Utiliser un state React `auto` propre.

## Composants visuels clés

### Navigation
- Sticky top, `backdrop-filter: blur(12px)`, background semi-transparent
- Logo "Gabriel." avec point bleu accent
- Liens : Portfolio, Blog, Docs
- Indicateur actif : underline bleu de 1px sous le lien
- Bouton Admin (vert quand actif, gris quand inactif)
- Bouton Maintenance (orange quand actif)
- Admin links : Admin Blog, Admin Docs (visibles uniquement quand admin)

### Bannière maintenance
- Bar orange en haut quand maintenance actif et admin connecté
- Icône 🔧 + texte "Mode maintenance actif — le site est masqué au public"

### Boutons hover
**CRITIQUE** — Les boutons utilisent des **refs DOM directes** (pas de state React) pour les hover :

```jsx
function HoverBtn({ onClick, label, baseStyle, hoverStyle }) {
  const ref = useRef(null);
  const enter = () => Object.assign(ref.current.style, hoverStyle);
  const leave = () => Object.assign(ref.current.style, baseStyle);
  return <button ref={ref} onClick={onClick} onMouseEnter={enter}
    onMouseLeave={leave} style={baseStyle}>{label}</button>;
}
```

Raison : un setState swap cause un flash blanc pendant le re-render car le navigateur interpole via `transition: all` entre l'ancien et le nouveau style. Le DOM mutation direct évite le re-render.

Transitions explicites (jamais `all`) :
```css
transition: color 0.2s, background 0.2s, border-color 0.2s;
```

### Blocs de code — Coloration syntaxique

Le prototype implémente un tokenizer custom pour `bash`, `env`, `js`, `yaml`. En production, utiliser une vraie lib (Shiki recommandé avec Astro). Les règles de coloration à respecter :

**bash** :
- Commandes (`git`, `curl`, `cd`, `npm`, etc.) → pink
- Flags (`--production`, `-f`, etc.) → purple
- Strings (entre quotes) → green
- Commentaires (#) → tertiary
- Pipes, redirections → tertiary

**env** :
- Clés (avant le =) → pink
- Valeurs (après le =) → green
- Nombres → yellow
- Commentaires → tertiary

**js/yaml** :
- Keywords → pink
- Strings → green
- Nombres → yellow
- Commentaires → tertiary/purple

## Spacing & Layout

### Maxwidth
- Contenu principal : `max-width: 1100px; margin: 0 auto; padding: 0 3rem`
- **IMPORTANT** : Ajouter `width: 100%` dans tout contexte flex column parent, sinon le `margin: 0 auto` ne fonctionne pas (le contenu se compresse au centre)

### Docs — Layout 3 colonnes
```css
display: grid;
grid-template-columns: 250px 1fr 170px;
```
- Colonne gauche : sidebar navigation (sections + pages)
- Colonne centrale : contenu de la page
- Colonne droite : TOC "Sur cette page" (headings h2)
- Chaque colonne a son propre scroll (`overflow-y: auto`)
- Le parent fait `height: 100vh - nav height`, `overflow: hidden`

### Blog — Articles
- Espacement entre articles : `margin-bottom: 4rem; padding-bottom: 4rem`
- Séparateur : `border-bottom: 1px solid var(--line)`

### Portfolio — Projets
- Grid : `grid-template-columns: 60px 1fr auto`
- Numéro italic Playfair à gauche, contenu au centre, tags à droite
- Boutons "Article →" et "Docs →" sous la description quand des liens existent

## Points d'attention pour l'implémentation

1. **Le fichier JSX fait foi** — En cas de doute sur un détail visuel, se référer à `design-3-editorial-v4.jsx`
2. **Pas de couleurs hardcodées** — Tout passe par les variables CSS du thème
3. **Transitions explicites** — Jamais `transition: all`, toujours lister les propriétés
4. **Fonts** — Charger via `@import` ou `<link>` Google Fonts, pas de fichiers locaux (sauf si offline requis)
5. **Scrollbar** — Custom 4px wide, track = bg, thumb = line color, border-radius 4px
6. **Selection** — `::selection { background: rgba(59,130,246,0.3) }`
