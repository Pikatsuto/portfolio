# Bugs Résolus & Leçons Apprises

Ce document recense les bugs critiques découverts pendant le prototypage. Claude Code doit éviter ces pièges lors de l'implémentation.

## 1. Flex container + margin auto = contenu compressé

**Symptôme** : Les pages admin étaient "serrées au centre" au lieu de prendre toute la largeur.

**Cause** : L'App root utilise `display: flex; flex-direction: column`. Dans ce contexte, un enfant avec `max-width: 1100px; margin: 0 auto` ne s'étend PAS à 100% — il se compresse à sa taille de contenu et se centre.

**Solution** : Ajouter `width: 100%` à TOUT conteneur qui utilise `margin: 0 auto` dans un parent flex column :
```css
/* FAUX — se compresse */
.container { max-width: 1100px; margin: 0 auto; padding: 0 3rem; }

/* CORRECT — pleine largeur puis contrainte */
.container { max-width: 1100px; width: 100%; margin: 0 auto; padding: 0 3rem; }
```

**Règle** : TOUJOURS mettre `width: 100%` quand on utilise `max-width + margin: 0 auto` dans un contexte flex.

## 2. Flash blanc au hover des boutons

**Symptôme** : Les boutons flashaient en blanc pendant 200ms au mouseLeave en dark mode.

**Cause** : `transition: all 0.2s` + changement de style via setState React. Le re-render cause une interpolation CSS de l'ancien état vers le default (blanc) puis vers le nouvel état.

**Solution** :
1. Ne JAMAIS utiliser `transition: all` — lister explicitement les propriétés
2. Utiliser des mutations DOM directes (ref) au lieu de state pour les hover :

```jsx
// FAUX — cause un re-render et potentiel flash
const [hovered, setHovered] = useState(false);
<button style={hovered ? hoverStyle : baseStyle} />

// CORRECT — mutation DOM directe, pas de re-render
const ref = useRef(null);
<button ref={ref}
  onMouseEnter={() => Object.assign(ref.current.style, hoverStyle)}
  onMouseLeave={() => Object.assign(ref.current.style, baseStyle)}
  style={baseStyle} />
```

**Transitions correctes** :
```css
transition: color 0.2s, background 0.2s, border-color 0.2s;
```

## 3. React Error #310 — Too many re-renders

**Symptôme** : Crash "Too many re-renders" au chargement de la page Docs.

**Cause** : Deux problèmes combinés :
1. `setState` appelé directement dans le corps du composant (pas dans un hook)
2. `useEffect` placé APRÈS un `return` conditionnel (violation des règles des hooks)

**Code fautif** :
```jsx
function DocPage() {
  const [activeProject, setActiveProject] = useState(null);
  
  // FAUX — setState pendant le render → boucle infinie
  if (initialNav.project !== activeProject) setActiveProject(initialNav.project);
  
  if (!activeProject) return <ProjectSelector />;
  
  // FAUX — hook après un return conditionnel
  useEffect(() => { ... }, []);
  
  return <DocViewer />;
}
```

**Solution** : TOUS les hooks AVANT tout return. Les setState conditionnels dans des useEffect :
```jsx
function DocPage() {
  const [activeProject, setActiveProject] = useState(null);
  
  // CORRECT — tous les hooks en premier
  useEffect(() => {
    if (initialNav.project) setActiveProject(initialNav.project);
  }, [initialNav]);
  
  useEffect(() => {
    if (activeProject && !activeId) {
      const first = docs.find(d => d.project === activeProject);
      if (first) setActiveId(first.id);
    }
  }, [activeProject, activeId, docs]);
  
  if (!activeProject) return <ProjectSelector />;
  return <DocViewer />;
}
```

## 4. Thème qui ne suit plus le système

**Symptôme** : Après avoir toggle manuellement le thème, le dark/light ne suivait plus les changements du système (prefers-color-scheme).

**Cause** : Utilisation de `window._themeManuallySet = true` (global) qui bloquait le listener définitivement. Le global persiste entre les re-renders et n'est jamais reset.

**Solution** : Utiliser un state React `auto` :
```jsx
const [auto, setAuto] = useState(true);
const [mode, setMode] = useState(getSystemMode);

useEffect(() => {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const handler = (e) => { if (auto) setMode(e.matches ? "light" : "dark"); };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}, [auto]);  // Le listener est recréé quand auto change

const toggle = () => { setAuto(false); setMode(m => m === "dark" ? "light" : "dark"); };
const resetAuto = () => { setAuto(true); setMode(getSystemMode()); };
```

**Règle** : Ne JAMAIS utiliser `window.*` pour du state React. Tout dans des hooks.

## 5. Alignement textarea / overlay pour l'éditeur

**Symptôme** : La sélection dans le textarea ne s'alignait pas avec le texte coloré de l'overlay.

**Cause** : Éléments `<div>` par ligne ajoutent du spacing implicite. `fontWeight: 600` sur certains tokens change la largeur des glyphes.

**Solution** :
- Utiliser `<span>` avec `\n` explicites au lieu de `<div>` par ligne
- Aucune variation de fontWeight dans le highlight (tout en 400)
- Propriétés font IDENTIQUES sur textarea et overlay :
```css
font-family: 'JetBrains Mono';
font-size: 0.88rem;
line-height: 1.8;
letter-spacing: 0px;
font-weight: 400;
tab-size: 2;
-webkit-text-size-adjust: 100%;
```

**Note** : En production avec Vditor, ce problème ne se pose pas (Vditor gère son propre overlay).

## Règles générales

1. **Tester en dark ET light** — Chaque couleur doit passer WCAG AA (4.5:1) sur les deux fonds
2. **Pas de globals window** — Tout le state dans React
3. **Hooks avant les returns** — Règle absolue React
4. **width: 100% dans flex** — Quand margin: 0 auto est utilisé
5. **Transitions explicites** — Jamais `transition: all`
6. **DOM direct pour hover** — useRef + Object.assign, pas de setState
7. **Versionner les fichiers** — Garder les anciennes versions (suffixes -backup, -pre-xxx)
