import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════
   THEME SYSTEM — dark/light + auto detect
   ═══════════════════════════════════════════ */
const themes = {
  dark: {
    bg: "#0c0c12", surface: "#121218", surfaceAlt: "#16161e",
    white: "#e8e8ec", body: "#c8c8cc", secondary: "#9a9aa0",
    tertiary: "#888890", blue: "#3b82f6", blueHover: "#60a5fa",
    decorative: "#6e6e78", line: "#1e1e26",
    codeBg: "#101016", green: "#34d399", red: "#f87171",
    navBg: "rgba(12,12,18,0.92)", heroGradient: "linear-gradient(135deg, rgba(59,130,246,0.06), transparent 60%)",
    synPink: "#f472b6", synPurple: "#e879f9", synGreen: "#34d399", synYellow: "#fbbf24",
  },
  light: {
    bg: "#f0f0f4", surface: "#f8f8fa", surfaceAlt: "#eaeaef",
    white: "#1a1a24", body: "#3a3a44", secondary: "#5a5a66",
    tertiary: "#72727e", blue: "#2563eb", blueHover: "#1d4ed8",
    decorative: "#a0a0ac", line: "#dcdce2",
    codeBg: "#e8e8ee", green: "#059669", red: "#dc2626",
    navBg: "rgba(240,240,244,0.92)", heroGradient: "linear-gradient(135deg, rgba(37,99,235,0.04), transparent 60%)",
    synPink: "#be185d", synPurple: "#7e22ce", synGreen: "#065f46", synYellow: "#92400e",
  },
};

function useTheme() {
  const getSystemMode = () => (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  const [auto, setAuto] = useState(true);
  const [mode, setMode] = useState(getSystemMode);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e) => { if (auto) setMode(e.matches ? "light" : "dark"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [auto]);

  const toggle = () => { setAuto(false); setMode(m => m === "dark" ? "light" : "dark"); };
  const resetAuto = () => { setAuto(true); setMode(getSystemMode()); };

  return { c: themes[mode], mode, toggle, auto, resetAuto };
}

/* ═══════════════════════════════════════════
   SIMPLE YAML PARSER / SERIALIZER
   ═══════════════════════════════════════════ */
function parseYaml(str) {
  const result = {};
  const lines = str.split("\n");
  let currentKey = null, currentArray = null, currentObj = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], trimmed = line.trimEnd();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const topMatch = trimmed.match(/^(\w+):\s*(.*)/);
    if (topMatch && !line.startsWith(" ") && !line.startsWith("\t")) {
      currentKey = topMatch[1]; const val = topMatch[2].trim();
      if (val === "") { result[currentKey] = []; currentArray = result[currentKey]; }
      else { result[currentKey] = val.replace(/^["']|["']$/g, ""); currentArray = null; }
      currentObj = null; continue;
    }
    const arrObjMatch = trimmed.match(/^\s+-\s+(\w+):\s*(.*)/);
    if (arrObjMatch && currentArray) { currentObj = { [arrObjMatch[1]]: arrObjMatch[2].trim().replace(/^["']|["']$/g, "") }; currentArray.push(currentObj); continue; }
    const arrSimpleMatch = trimmed.match(/^\s+-\s+(.*)/);
    if (arrSimpleMatch && currentArray && !currentObj) { currentArray.push(arrSimpleMatch[1].trim().replace(/^["']|["']$/g, "")); continue; }
    const objPropMatch = trimmed.match(/^\s+(\w+):\s*(.*)/);
    if (objPropMatch && currentObj) {
      let val = objPropMatch[2].trim();
      if (val.startsWith("[") && val.endsWith("]")) val = val.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
      else val = val.replace(/^["']|["']$/g, "");
      currentObj[objPropMatch[1]] = val; continue;
    }
  }
  return result;
}

function toYaml(obj) {
  let out = "";
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string" || typeof val === "number") {
      const needsQ = typeof val === "string" && (val.includes(":") || val.includes("*") || val.includes(","));
      out += `${key}: ${needsQ ? `"${val}"` : val}\n`;
    } else if (Array.isArray(val)) {
      out += `${key}:\n`;
      for (const item of val) {
        if (typeof item === "string") out += `  - ${item}\n`;
        else if (typeof item === "object") {
          const entries = Object.entries(item);
          if (entries.length > 0) {
            out += `  - ${entries[0][0]}: ${Array.isArray(entries[0][1]) ? `[${entries[0][1].join(", ")}]` : entries[0][1]}\n`;
            for (let i = 1; i < entries.length; i++) { const v = entries[i][1]; out += `    ${entries[i][0]}: ${Array.isArray(v) ? `[${v.join(", ")}]` : v}\n`; }
          }
        }
      }
    }
  }
  return out;
}

function parseMDX(mdx) {
  const match = mdx.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: mdx };
  return { frontmatter: parseYaml(match[1]), body: match[2].trim() };
}

function serializeMDX(frontmatter, body) { return `---\n${toYaml(frontmatter)}---\n\n${body}`; }

/* ═══════════════════════════════════════════
   SYNTAX HIGHLIGHTING
   ═══════════════════════════════════════════ */
function highlightLine(line, lang, c) {
  if (!line) return [{ text: "\u00A0", color: c.tertiary }];

  const tokens = [];
  const push = (text, color) => tokens.push({ text, color });

  // Comments
  if (line.trimStart().startsWith("#") || line.trimStart().startsWith("//")) {
    push(line, c.tertiary);
    return tokens;
  }

  if (lang === "env" || lang === "dotenv") {
    const eqIdx = line.indexOf("=");
    if (eqIdx > 0) {
      push(line.slice(0, eqIdx), c.synPurple);  // purple for key
      push("=", c.tertiary);
      push(line.slice(eqIdx + 1), c.synGreen); // green for value
      return tokens;
    }
    push(line, c.blueHover);
    return tokens;
  }

  if (lang === "bash" || lang === "sh" || lang === "shell" || lang === "zsh") {
    // Bash tokenizer
    let remaining = line;
    let result = [];

    // Leading $ prompt
    if (remaining.startsWith("$ ")) {
      push("$ ", c.tertiary);
      remaining = remaining.slice(2);
    }

    // Tokenize bash
    const bashKeywords = /^(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|export|source|alias|cd|cp|mv|rm|mkdir|chmod|chown|cat|grep|sed|awk|curl|wget|sudo|apt|pip|npm|git|docker|docker-compose|make|ssh|scp|tar|unzip|nano|vim|ls|find|xargs|tee|tail|head|wc|sort|uniq|diff|kill|ps|top|df|du|mount|umount|systemctl|journalctl|nginx|python|python3|node|bash|sh)(\s|$)/;
    const parts = remaining.split(/(\s+|[|><;&(){}[\]]|"[^"]*"|'[^']*'|`[^`]*`|\$\{[^}]*\}|\$\w+|--?\w[\w-]*)/);

    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('"') || part.startsWith("'") || part.startsWith("`")) {
        push(part, c.synGreen); // green for strings
      } else if (part.startsWith("$")) {
        push(part, c.synYellow); // yellow for variables
      } else if (part.startsWith("--") || part.startsWith("-")) {
        push(part, c.synPurple); // purple for flags
      } else if (part.match(bashKeywords) || ["if","then","else","fi","for","while","do","done","echo","export","sudo","git","docker","cd","curl","npm","pip","python","python3","node","cat","grep","sed","mkdir","chmod","cp","mv","rm","ls","find","tar","make","ssh","bash","sh","apt","nano","vim","kill","ps","nginx","systemctl"].includes(part.trim())) {
        push(part, c.synPink); // pink for keywords/commands
      } else if (part.match(/^[|><;&(){}[\]]+$/)) {
        push(part, c.tertiary); // dim for operators
      } else if (part.match(/^\d+$/)) {
        push(part, c.synYellow); // yellow for numbers
      } else {
        push(part, c.blueHover); // default
      }
    }
    return tokens.length ? tokens : [{ text: line, color: c.blueHover }];
  }

  if (lang === "js" || lang === "javascript" || lang === "jsx" || lang === "ts" || lang === "typescript") {
    const jsKeywords = ["const","let","var","function","return","if","else","for","while","import","export","from","default","class","new","this","async","await","try","catch","throw","switch","case","break","continue","typeof","instanceof","null","undefined","true","false"];
    const parts = line.split(/(\s+|[{}()[\];,.:=+\-*/<>!&|?]|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*$|\d+\.?\d*)/);
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('"') || part.startsWith("'") || part.startsWith("`")) push(part, c.synGreen);
      else if (part.startsWith("//")) push(part, c.tertiary);
      else if (jsKeywords.includes(part.trim())) push(part, c.synPink);
      else if (part.match(/^\d+\.?\d*$/)) push(part, c.synYellow);
      else if (part.match(/^[{}()[\];,.:=+\-*/<>!&|?]+$/)) push(part, c.tertiary);
      else push(part, c.blueHover);
    }
    return tokens.length ? tokens : [{ text: line, color: c.blueHover }];
  }

  // Generic/yaml/unknown - basic highlighting
  const eqIdx = line.indexOf(":");
  if (eqIdx > 0 && eqIdx < 30 && !line.trim().startsWith("-")) {
    push(line.slice(0, eqIdx), c.synPurple);
    push(":", c.tertiary);
    const val = line.slice(eqIdx + 1);
    if (val.trim().startsWith('"') || val.trim().startsWith("'")) push(val, c.synGreen);
    else push(val, c.blueHover);
    return tokens;
  }

  push(line, c.blueHover);
  return tokens;
}

function HighlightedCode({ code, lang, c }) {
  const lines = code || [];
  return (
    <div style={{ background: c.codeBg, border: `1px solid ${c.line}`, borderLeft: `3px solid ${c.blue}`, padding: "1rem 1.3rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.84rem", margin: "1.2rem 0", borderRadius: "4px", overflowX: "auto", lineHeight: 1.7 }}>
      {lines.map((line, i) => (
        <div key={i}>
          {highlightLine(line, lang, c).map((tok, j) => (
            <span key={j} style={{ color: tok.color }}>{tok.text}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* Highlighted textarea overlay for editors */
function HighlightedTextarea({ value, onChange, c, style }) {
  const taRef = useRef(null);
  const preRef = useRef(null);

  const syncScroll = () => {
    if (taRef.current && preRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  // Detect language per line based on fenced code blocks
  const renderHighlighted = (text) => {
    const lines = text.split("\n");
    let inCode = false, lang = "";
    return lines.map((line, i) => {
      const nl = i < lines.length - 1 ? "\n" : "";
      if (line.startsWith("```")) {
        if (!inCode) { inCode = true; lang = line.slice(3).trim(); return <span key={i} style={{ color: c.tertiary }}>{line}{nl}</span>; }
        else { inCode = false; lang = ""; return <span key={i} style={{ color: c.tertiary }}>{line}{nl}</span>; }
      }
      if (inCode) {
        const tokens = highlightLine(line, lang, c);
        return <span key={i}>{tokens.map((t, j) => <span key={j} style={{ color: t.color }}>{t.text}</span>)}{nl}</span>;
      }
      // Markdown syntax highlighting
      if (line.startsWith("## ")) return <span key={i}><span style={{ color: c.tertiary }}>## </span><span style={{ color: c.white }}>{line.slice(3)}</span>{nl}</span>;
      if (line.startsWith("### ")) return <span key={i}><span style={{ color: c.tertiary }}>### </span><span style={{ color: c.white }}>{line.slice(4)}</span>{nl}</span>;
      if (line.startsWith("- ")) return <span key={i}><span style={{ color: c.synPink }}>- </span><span style={{ color: c.body }}>{line.slice(2)}</span>{nl}</span>;
      if (line.startsWith("---")) return <span key={i} style={{ color: c.tertiary }}>{line}{nl}</span>;
      // Inline highlights
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/);
      return <span key={i}>{parts.map((p, j) => {
        if (p.startsWith("**")) return <span key={j} style={{ color: c.synYellow }}>{p}</span>;
        if (p.startsWith("*") && p.endsWith("*")) return <span key={j} style={{ color: c.synPurple }}>{p}</span>;
        if (p.startsWith("`")) return <span key={j} style={{ color: c.synGreen }}>{p}</span>;
        if (p.startsWith("[")) return <span key={j} style={{ color: c.blue }}>{p}</span>;
        return <span key={j} style={{ color: c.body }}>{p}</span>;
      })}{nl}</span>;
    });
  };

  const sharedStyle = {
    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.88rem", lineHeight: "1.8",
    padding: "1.5rem", margin: 0, border: "none", whiteSpace: "pre-wrap", wordWrap: "break-word",
    overflowWrap: "break-word", letterSpacing: "0px", fontWeight: 400, tabSize: 2,
    WebkitTextSizeAdjust: "100%", textRendering: "auto",
  };

  return (
    <div style={{ position: "relative", ...style, overflow: "hidden" }}>
      <pre ref={preRef} aria-hidden="true" style={{
        ...sharedStyle, position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: c.bg, color: c.body, pointerEvents: "none", overflowY: "auto",
        zIndex: 1,
      }}>{renderHighlighted(value)}</pre>
      <textarea ref={taRef} value={value} onChange={onChange} onScroll={syncScroll} spellCheck={false} style={{
        ...sharedStyle, position: "relative", width: "100%", height: "100%",
        background: "transparent", color: "transparent", caretColor: c.blueHover,
        resize: "none", outline: "none", zIndex: 2, overflowY: "auto",
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   DEFAULT DATA
   ═══════════════════════════════════════════ */
const defaultPortfolioMDX = `---
name: Gabriel
title: Gabriel Music
role: SysAdmin / DevOps / Full-Stack
headline: "Construire, *automatiser*, déployer."
bio: "Je crée des infrastructures self-hosted et des outils que j'utilise au quotidien. Chaque projet résout un vrai problème."

skills:
  - name: Linux
    details: Debian · Ubuntu · Arch
  - name: Containers
    details: Docker · Proxmox · LXC
  - name: Dev
    details: Vue.js · React · Python · Bash
  - name: Infra
    details: Nginx · CI/CD · ZFS

projects:
  - title: UniDash
    description: Orchestration cloud self-hosted avec monitoring intégré et interface de gestion complète
    tags: [Docker, Vue.js, Python]
    docs: UniDash
  - title: AstralEmu
    description: Distribution Linux complète dédiée à l'émulation retro gaming avec builders dynamiques
    tags: [Linux, Bash, CI/CD]
    docs: AstralEmu
  - title: Centrarr
    description: Serveur média avec authentification WebAuthn passkeys et gestion multi-utilisateurs
    tags: [Auth, Node.js, SQLite]
    blog: webauthn-node
    docs: Centrarr
  - title: IsolApp
    description: Système d'orchestration Docker en environnements chroot isolés haute performance
    tags: [Docker, Nginx, Bash]
    blog: docker-compose-quit
    docs: IsolApp

stats:
  - value: 5+
    label: Années XP
  - value: 20+
    label: Projets
  - value: 99.9%
    label: Uptime
  - value: ∞
    label: Café
---

## À propos

Passionné d'infrastructure et d'automatisation depuis plus de 5 ans, je conçois des systèmes **fiables** et **performants**. Mon approche : comprendre le *pourquoi* avant le *comment*, et ne jamais déployer ce que je ne comprends pas.

## Philosophie

\`\`\`
Si c'est manuel, c'est automatisable.
Si c'est automatisé, c'est documentable.
Si c'est documenté, c'est maintenable.
\`\`\`

## Contact

Disponible pour des missions freelance en **DevOps**, **administration système**, ou **développement full-stack**.`;

const defaultPosts = [
  { id: "docker-compose-quit", title: "Pourquoi j'ai quitté Docker Compose", date: "15 Décembre 2025", cat: "DevOps", time: "8 min de lecture", visible: true, docProject: "IsolApp", draft: null, history: [{ date: "15 Déc 2025 10:30", summary: "Publication initiale", content: "..." }], excerpt: "Après 3 ans d'utilisation intensive, voici pourquoi j'ai développé ma propre solution d'orchestration conteneurisée.", content: `Docker Compose m'a accompagné pendant 3 ans. Chaque projet passait par un \`docker-compose.yml\`. Jusqu'au jour où ça n'a plus suffi.

## Le point de rupture

Tout a commencé quand j'ai voulu déployer une quinzaine de services sur un même serveur, chacun avec son propre réseau isolé. Le fichier Compose est devenu un monstre de 800 lignes. Le vrai problème n'était pas la taille — c'était le **manque de contrôle**.

- Du routing réseau fin entre conteneurs isolés
- Des healthchecks personnalisés avec retry logic
- Du hot-reload de configuration sans restart
- De la gestion de secrets qui ne soit pas du bind mount en clair

## La solution : IsolApp

\`\`\`bash
isolapp deploy --name grafana \\
  --image grafana/grafana:latest \\
  --network isolated \\
  --port 3000:3000 \\
  --healthcheck "curl -f http://localhost:3000/api/health"
\`\`\`

Chaque commande correspond à un appel système réel. Pas d'abstraction, pas de magie.

## Les résultats après 6 mois

- **Temps de déploiement** : -40% en moyenne
- **Debugging** : direct et précis via syscalls
- **Ressources** : contrôle granulaire via cgroups v2
- **Fiabilité** : 99.97% d'uptime

## Recommandation

**Non**, ne quittez pas Compose si vous avez moins de 10 services. Mais si vous gérez un homelab complexe et avez une allergie aux boîtes noires : écrire votre propre solution paie.` },
  { id: "zfs-proxmox", title: "ZFS sur Proxmox : le guide complet", date: "28 Novembre 2025", cat: "Sysadmin", time: "12 min", visible: true, docProject: null, draft: null, history: [], excerpt: "Configuration, snapshots, réplication — tout pour un storage solide.", content: "Article complet à venir..." },
  { id: "webauthn-node", title: "WebAuthn dans Node.js", date: "10 Novembre 2025", cat: "Dev", time: "10 min", visible: true, docProject: "Centrarr", draft: null, history: [], excerpt: "Implémentation passkeys de A à Z.", content: "Article complet à venir..." },
];

const defaultDocs = [
  // UniDash docs
  { id: "ud-installation", project: "UniDash", section: "Démarrage", title: "Installation", visible: true, draft: null, history: [{ date: "01 Nov 2025 14:00", summary: "Création" }], content: `Assurez-vous d'avoir installé :\n\n- **Docker** version 24+\n- **Node.js** 20 LTS\n- **Git**\n\n## Installation rapide\n\n\`\`\`bash\ngit clone https://github.com/gabmusic/unidash.git\ncd unidash && ./install.sh --production\n\`\`\`\n\n## Configuration\n\n\`\`\`env\nAPP_PORT=3000\nDB_PATH=./data/app.db\nJWT_SECRET=your-secret-here\n\`\`\`\n\n## Vérification\n\n\`\`\`bash\ncurl http://localhost:3000/api/health\n\`\`\`` },
  { id: "ud-configuration", project: "UniDash", section: "Démarrage", title: "Configuration", visible: true, draft: null, history: [], content: "Guide de configuration détaillé à venir..." },
  { id: "ud-deploiement", project: "UniDash", section: "Démarrage", title: "Déploiement", visible: true, draft: null, history: [], content: "Guide de déploiement à venir..." },
  { id: "ud-vue-ensemble", project: "UniDash", section: "Architecture", title: "Vue d'ensemble", visible: true, draft: null, history: [], content: "Architecture générale de UniDash à venir..." },
  { id: "ud-services", project: "UniDash", section: "Architecture", title: "Services", visible: true, draft: null, history: [], content: "Description des services à venir..." },
  { id: "ud-base-de-donnees", project: "UniDash", section: "Architecture", title: "Base de données", visible: true, draft: null, history: [], content: "Schéma de la base de données à venir..." },
  { id: "ud-authentification", project: "UniDash", section: "API Reference", title: "Authentification", visible: true, draft: null, history: [], content: "Documentation de l'authentification API à venir..." },
  { id: "ud-endpoints", project: "UniDash", section: "API Reference", title: "Endpoints", visible: true, draft: null, history: [], content: "Liste des endpoints API à venir..." },
  { id: "ud-webhooks", project: "UniDash", section: "API Reference", title: "Webhooks", visible: true, draft: null, history: [], content: "Documentation des webhooks à venir..." },
  { id: "ud-migration", project: "UniDash", section: "Guides avancés", title: "Migration", visible: true, draft: null, history: [], content: "Guide de migration à venir..." },
  { id: "ud-backup", project: "UniDash", section: "Guides avancés", title: "Backup", visible: true, draft: null, history: [], content: "Guide de backup à venir..." },
  { id: "ud-monitoring", project: "UniDash", section: "Guides avancés", title: "Monitoring", visible: true, draft: null, history: [], content: "Guide de monitoring à venir..." },
  // AstralEmu docs
  { id: "ae-installation", project: "AstralEmu", section: "Démarrage", title: "Installation", visible: true, draft: null, history: [], content: "## Prérequis\n\n- Un système Linux 64-bit\n- 4Go de RAM minimum\n- 20Go d'espace disque\n\n## Installation\n\n```bash\ncurl -fsSL https://astralemu.dev/install.sh | bash\n```\n\n## Premier lancement\n\n```bash\nastralemu --init\nastralemu start\n```" },
  { id: "ae-roms", project: "AstralEmu", section: "Démarrage", title: "Gestion des ROMs", visible: true, draft: null, history: [], content: "Guide de gestion des ROMs à venir..." },
  { id: "ae-builders", project: "AstralEmu", section: "Architecture", title: "Builders dynamiques", visible: true, draft: null, history: [], content: "Documentation des builders dynamiques à venir..." },
  { id: "ae-themes", project: "AstralEmu", section: "Personnalisation", title: "Thèmes EmulationStation", visible: true, draft: null, history: [], content: "Guide de personnalisation des thèmes à venir..." },
  // Centrarr docs
  { id: "ct-installation", project: "Centrarr", section: "Démarrage", title: "Installation", visible: true, draft: null, history: [], content: "## Installation rapide\n\n```bash\nnpm install -g centrarr\ncentrarr init\n```\n\n## Configuration WebAuthn\n\nLa configuration des passkeys se fait dans `config.json`.\n\n```env\nWEBAUTHN_RP_NAME=Centrarr\nWEBAUTHN_RP_ID=media.example.com\n```" },
  { id: "ct-webauthn", project: "Centrarr", section: "Authentification", title: "WebAuthn Passkeys", visible: true, draft: null, history: [], content: "Guide complet WebAuthn à venir..." },
  { id: "ct-users", project: "Centrarr", section: "Authentification", title: "Gestion utilisateurs", visible: true, draft: null, history: [], content: "Gestion des utilisateurs et sous-comptes à venir..." },
  // IsolApp docs
  { id: "ia-installation", project: "IsolApp", section: "Démarrage", title: "Installation", visible: true, draft: null, history: [], content: "## Prérequis\n\n- Docker 24+\n- Nginx\n- Linux avec support chroot\n\n## Installation\n\n```bash\ngit clone https://github.com/gabmusic/isolapp.git\ncd isolapp && make install\n```" },
  { id: "ia-chroot", project: "IsolApp", section: "Architecture", title: "Environnements chroot", visible: true, draft: null, history: [], content: "Documentation des environnements chroot isolés à venir..." },
  { id: "ia-networking", project: "IsolApp", section: "Architecture", title: "Réseau isolé", visible: true, draft: null, history: [], content: "Documentation du networking inter-conteneurs à venir..." },
];
const docSectionsOrder = ["Démarrage", "Architecture", "API Reference", "Guides avancés", "Personnalisation", "Authentification"];
const docProjects = ["UniDash", "AstralEmu", "Centrarr", "IsolApp"];

/* ═══════════════════════════════════════════
   MARKDOWN RENDERER
   ═══════════════════════════════════════════ */
function renderInline(text, c) {
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const m = match[0];
    if (m.startsWith("`")) parts.push(<code key={match.index} style={{ background: c.codeBg, border: `1px solid ${c.line}`, padding: "0.1rem 0.35rem", borderRadius: "3px", fontSize: "0.88em", color: c.blueHover, fontFamily: "'JetBrains Mono', monospace" }}>{m.slice(1, -1)}</code>);
    else if (m.startsWith("**")) parts.push(<strong key={match.index} style={{ color: c.white, fontWeight: 600 }}>{m.slice(2, -2)}</strong>);
    else if (m.startsWith("*")) parts.push(<em key={match.index}>{m.slice(1, -1)}</em>);
    else if (m.startsWith("[")) { const l = m.match(/\[([^\]]+)\]/)[1]; parts.push(<a key={match.index} href="#" style={{ color: c.blue, textDecoration: "underline", textUnderlineOffset: "3px" }}>{l}</a>); }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(md, c) {
  if (!md) return null;
  const lines = md.split("\n"), elements = [];
  let inCode = false, codeLines = [], codeLang = "", listItems = [];
  const flushList = () => { if (listItems.length > 0) { elements.push(<ul key={`l${elements.length}`} style={{ paddingLeft: "1.2rem", marginBottom: "1.2rem" }}>{listItems.map((li, j) => <li key={j} style={{ marginBottom: "0.4rem", color: c.body, lineHeight: 1.8 }}>{renderInline(li, c)}</li>)}</ul>); listItems = []; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (inCode) { elements.push(<HighlightedCode key={`c${i}`} code={codeLines} lang={codeLang} c={c} />); codeLines = []; codeLang = ""; inCode = false; } else { flushList(); codeLang = line.slice(3).trim(); inCode = true; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (line.startsWith("- ")) { listItems.push(line.slice(2)); continue; } else if (listItems.length) flushList();
    if (line.startsWith("## ")) elements.push(<h2 key={i} style={{ fontFamily: "'Playfair Display', serif", color: c.white, fontSize: "1.4rem", fontWeight: 600, margin: "2.5rem 0 1rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${c.line}` }}>{line.slice(3)}</h2>);
    else if (line.startsWith("### ")) elements.push(<h3 key={i} style={{ fontFamily: "'Playfair Display', serif", color: c.white, fontSize: "1.15rem", fontWeight: 600, margin: "2rem 0 0.8rem" }}>{line.slice(4)}</h3>);
    else if (line.trim() === "") elements.push(<div key={i} style={{ height: "0.6rem" }} />);
    else elements.push(<p key={i} style={{ marginBottom: "0.8rem", lineHeight: 1.9 }}>{renderInline(line, c)}</p>);
  }
  flushList(); return elements;
}

function extractTOC(md) { return md ? md.split("\n").filter(l => l.startsWith("## ")).map(l => l.slice(3)) : []; }

/* ═══════════════════════════════════════════
   THEME TOGGLE BUTTON
   ═══════════════════════════════════════════ */
function ThemeToggle({ mode, toggle, c, auto, resetAuto }) {
  return (
    <button onClick={toggle} onDoubleClick={auto ? undefined : resetAuto} title={auto ? `Auto (${mode})` : `${mode === "dark" ? "Mode clair" : "Mode sombre"} · double-clic = auto`} style={{
      background: "transparent", border: `1px solid ${auto ? c.blue + "44" : c.line}`, color: auto ? c.blue : c.tertiary,
      width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1rem", transition: "color 0.3s, border-color 0.3s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = c.blue; e.currentTarget.style.color = c.blueHover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = auto ? c.blue + "44" : c.line; e.currentTarget.style.color = auto ? c.blue : c.tertiary; }}
    >{mode === "dark" ? "☀" : "☾"}</button>
  );
}

/* ═══════════════════════════════════════════
   MARKDOWN EDITOR
   ═══════════════════════════════════════════ */
function MarkdownEditor({ content, onSave, onCancel, title, onTitleChange, c }) {
  const [md, setMd] = useState(content);
  const [mode, setMode] = useState("split");
  const taRef = useRef(null);
  const insert = useCallback((before, after = "") => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd, sel = md.slice(s, e);
    setMd(md.slice(0, s) + before + (sel || "texte") + after + md.slice(e));
  }, [md]);
  const tb = [
    { icon: "B", a: () => insert("**", "**") }, { icon: "I", a: () => insert("*", "*") }, { sep: 1 },
    { icon: "H1", a: () => insert("\n## ", "\n") }, { icon: "H2", a: () => insert("\n### ", "\n") }, { sep: 1 },
    { icon: "•", a: () => insert("\n- ", "\n") }, { icon: "<>", a: () => insert("`", "`") },
    { icon: "```", a: () => insert("\n```bash\n", "\n```\n") }, { sep: 1 },
    { icon: "🔗", a: () => insert("[", "](url)") },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: c.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1.5rem", background: c.surface, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: "0.75rem", color: c.tertiary, letterSpacing: "1px", textTransform: "uppercase" }}>Éditeur</span>
          {onTitleChange && <input value={title} onChange={e => onTitleChange(e.target.value)} style={{ background: c.bg, border: `1px solid ${c.line}`, color: c.white, padding: "0.4rem 0.8rem", fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, borderRadius: "4px", outline: "none", width: 320 }} />}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["edit", "split", "preview"].map(m => <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? `${c.blue}22` : "transparent", border: `1px solid ${mode === m ? c.blue + "55" : c.line}`, color: mode === m ? c.blueHover : c.tertiary, padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'DM Sans'", fontWeight: 500, borderRadius: "4px" }}>{m === "edit" ? "Édition" : m === "split" ? "Split" : "Aperçu"}</button>)}
          <div style={{ width: 1, background: c.line, margin: "0 0.3rem" }} />
          <button onClick={onCancel} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.35rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", borderRadius: "4px" }}>Annuler</button>
          <button onClick={() => onSave(md)} style={{ background: c.blue, border: "none", color: "#fff", padding: "0.35rem 1.2rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", fontWeight: 600, borderRadius: "4px" }}>Sauvegarder</button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.15rem", padding: "0.4rem 1.5rem", background: c.surfaceAlt, borderBottom: `1px solid ${c.line}` }}>
        {tb.map((item, i) => item.sep ? <div key={i} style={{ width: 1, height: 18, background: c.line, margin: "0 0.4rem" }} /> : <button key={i} onClick={item.a} style={{ background: "transparent", border: "none", color: c.tertiary, padding: "0.3rem 0.5rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: item.icon === "B" || item.icon === "I" ? "serif" : "'JetBrains Mono'", fontWeight: item.icon === "B" ? 800 : 400, fontStyle: item.icon === "I" ? "italic" : "normal", borderRadius: "3px" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${c.blue}15`; e.currentTarget.style.color = c.blueHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.tertiary; }}
        >{item.icon}</button>)}
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: mode === "split" ? "1fr 1fr" : "1fr", overflow: "hidden" }}>
        {mode !== "preview" && <HighlightedTextarea value={md} onChange={e => setMd(e.target.value)} c={c} style={{ borderRight: mode === "split" ? `1px solid ${c.line}` : "none" }} />}
        {mode !== "edit" && <div style={{ padding: "1.5rem 2rem", overflowY: "auto", fontFamily: "'DM Sans'", color: c.body, fontSize: "0.95rem", lineHeight: 1.9, background: mode === "preview" ? c.bg : c.surface }}>{renderMarkdown(md, c)}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MDX EDITOR (YAML form + MD editor)
   ═══════════════════════════════════════════ */
function MDXEditor({ mdxContent, onSave, onCancel, c }) {
  const { frontmatter: fm, body } = parseMDX(mdxContent);
  const [frontmatter, setFrontmatter] = useState(fm);
  const [yamlTab, setYamlTab] = useState("general");
  const [mdBody, setMdBody] = useState(body);
  const [mode, setMode] = useState("split");
  const taRef = useRef(null);

  const updateFM = (k, v) => setFrontmatter(f => ({ ...f, [k]: v }));
  const updateArr = (k, i, f, v) => setFrontmatter(fm => { const a = [...(fm[k] || [])]; a[i] = { ...a[i], [f]: v }; return { ...fm, [k]: a }; });
  const removeArr = (k, i) => setFrontmatter(f => ({ ...f, [k]: f[k].filter((_, j) => j !== i) }));
  const addArr = (k, t) => setFrontmatter(f => ({ ...f, [k]: [...(f[k] || []), t] }));
  const handleSave = () => onSave(serializeMDX(frontmatter, mdBody));

  const insert = useCallback((before, after = "") => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd, sel = mdBody.slice(s, e);
    setMdBody(mdBody.slice(0, s) + before + (sel || "texte") + after + mdBody.slice(e));
  }, [mdBody]);

  const tb = [{ icon: "B", a: () => insert("**", "**") }, { icon: "I", a: () => insert("*", "*") }, { sep: 1 }, { icon: "H1", a: () => insert("\n## ", "\n") }, { icon: "H2", a: () => insert("\n### ", "\n") }, { sep: 1 }, { icon: "•", a: () => insert("\n- ", "\n") }, { icon: "<>", a: () => insert("`", "`") }, { icon: "```", a: () => insert("\n```bash\n", "\n```\n") }];
  const inp = { background: c.bg, border: `1px solid ${c.line}`, color: c.white, padding: "0.5rem 0.7rem", fontFamily: "'DM Sans'", fontSize: "0.88rem", borderRadius: "4px", outline: "none", width: "100%" };
  const lab = { fontFamily: "'DM Sans'", fontSize: "0.72rem", color: c.tertiary, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.3rem", display: "block", fontWeight: 500 };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: c.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1.5rem", background: c.surface, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: "0.75rem", color: c.blue, letterSpacing: "1px", fontWeight: 600 }}>MDX</span>
          <span style={{ fontFamily: "'DM Sans'", fontSize: "0.88rem", color: c.white, fontWeight: 500 }}>Portfolio</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onCancel} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.35rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", borderRadius: "4px" }}>Annuler</button>
          <button onClick={handleSave} style={{ background: c.blue, border: "none", color: "#fff", padding: "0.35rem 1.2rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", fontWeight: 600, borderRadius: "4px" }}>Sauvegarder</button>
        </div>
      </div>
      {/* YAML tabs */}
      <div style={{ borderBottom: `1px solid ${c.line}` }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 1.5rem", borderBottom: `1px solid ${c.line}`, background: c.surfaceAlt }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.7rem", color: c.blue, padding: "0.6rem 0.8rem 0.6rem 0", borderRight: `1px solid ${c.line}`, marginRight: "0.5rem" }}>YAML</span>
          {[["general", "Général"], ["skills", `Skills (${(frontmatter.skills || []).length})`], ["projects", `Projets (${(frontmatter.projects || []).length})`], ["stats", `Stats (${(frontmatter.stats || []).length})`]].map(([id, label]) => (
            <button key={id} onClick={() => setYamlTab(id)} style={{ background: yamlTab === id ? `${c.blue}15` : "transparent", border: "none", borderBottom: yamlTab === id ? `2px solid ${c.blue}` : "2px solid transparent", color: yamlTab === id ? c.blueHover : c.tertiary, padding: "0.6rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", fontWeight: 500 }}>{label}</button>
          ))}
        </div>
        <div style={{ padding: "1.2rem 1.5rem", maxHeight: 260, overflowY: "auto" }}>
          {yamlTab === "general" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div><label style={lab}>Nom</label><input value={frontmatter.name || ""} onChange={e => updateFM("name", e.target.value)} style={inp} /></div>
            <div><label style={lab}>Rôle</label><input value={frontmatter.role || ""} onChange={e => updateFM("role", e.target.value)} style={inp} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={lab}>Headline</label><input value={frontmatter.headline || ""} onChange={e => updateFM("headline", e.target.value)} style={inp} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={lab}>Bio</label><textarea value={frontmatter.bio || ""} onChange={e => updateFM("bio", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
          </div>}
          {yamlTab === "skills" && <div>
            {(frontmatter.skills || []).map((s, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 32px", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input value={s.name || ""} onChange={e => updateArr("skills", i, "name", e.target.value)} placeholder="Nom" style={inp} />
              <input value={s.details || ""} onChange={e => updateArr("skills", i, "details", e.target.value)} placeholder="Détails" style={inp} />
              <button onClick={() => removeArr("skills", i)} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.red, width: 32, height: 32, cursor: "pointer", borderRadius: "4px" }}>×</button>
            </div>)}
            <button onClick={() => addArr("skills", { name: "", details: "" })} style={{ background: `${c.blue}10`, border: `1px dashed ${c.blue}44`, color: c.blueHover, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", borderRadius: "4px", width: "100%" }}>+ Skill</button>
          </div>}
          {yamlTab === "projects" && <div>
            {(frontmatter.projects || []).map((p, i) => <div key={i} style={{ padding: "0.8rem", background: c.surfaceAlt, borderRadius: "6px", marginBottom: "0.6rem", border: `1px solid ${c.line}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 32px", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input value={p.title || ""} onChange={e => updateArr("projects", i, "title", e.target.value)} style={{ ...inp, fontWeight: 600 }} />
                <button onClick={() => removeArr("projects", i)} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.red, width: 32, height: 32, cursor: "pointer", borderRadius: "4px" }}>×</button>
              </div>
              <input value={p.description || ""} onChange={e => updateArr("projects", i, "description", e.target.value)} style={{ ...inp, marginBottom: "0.5rem" }} />
              <input value={Array.isArray(p.tags) ? p.tags.join(", ") : ""} onChange={e => updateArr("projects", i, "tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="Tags (virgules)" style={inp} />
            </div>)}
            <button onClick={() => addArr("projects", { title: "", description: "", tags: [] })} style={{ background: `${c.blue}10`, border: `1px dashed ${c.blue}44`, color: c.blueHover, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", borderRadius: "4px", width: "100%" }}>+ Projet</button>
          </div>}
          {yamlTab === "stats" && <div>
            {(frontmatter.stats || []).map((s, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 32px", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input value={s.value || ""} onChange={e => updateArr("stats", i, "value", e.target.value)} style={{ ...inp, fontWeight: 700, textAlign: "center" }} />
              <input value={s.label || ""} onChange={e => updateArr("stats", i, "label", e.target.value)} style={inp} />
              <button onClick={() => removeArr("stats", i)} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.red, width: 32, height: 32, cursor: "pointer", borderRadius: "4px" }}>×</button>
            </div>)}
            <button onClick={() => addArr("stats", { value: "", label: "" })} style={{ background: `${c.blue}10`, border: `1px dashed ${c.blue}44`, color: c.blueHover, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", borderRadius: "4px", width: "100%" }}>+ Stat</button>
          </div>}
        </div>
      </div>
      {/* MDX toolbar */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 1.5rem", background: c.surfaceAlt, borderBottom: `1px solid ${c.line}` }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.7rem", color: c.blue, padding: "0.5rem 0.8rem 0.5rem 0", borderRight: `1px solid ${c.line}`, marginRight: "0.5rem" }}>MDX</span>
        {tb.map((item, i) => item.sep ? <div key={i} style={{ width: 1, height: 18, background: c.line, margin: "0 0.4rem" }} /> : <button key={i} onClick={item.a} style={{ background: "transparent", border: "none", color: c.tertiary, padding: "0.3rem 0.45rem", cursor: "pointer", fontSize: "0.75rem", fontFamily: item.icon === "B" || item.icon === "I" ? "serif" : "'JetBrains Mono'", fontWeight: item.icon === "B" ? 800 : 400, fontStyle: item.icon === "I" ? "italic" : "normal", borderRadius: "3px" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${c.blue}15`; e.currentTarget.style.color = c.blueHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.tertiary; }}
        >{item.icon}</button>)}
        <div style={{ flex: 1 }} />
        {["edit", "split", "preview"].map(m => <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? `${c.blue}22` : "transparent", border: "none", color: mode === m ? c.blueHover : c.tertiary, padding: "0.4rem 0.7rem", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans'", fontWeight: 500, borderRadius: "4px" }}>{m === "edit" ? "Édition" : m === "split" ? "Split" : "Aperçu"}</button>)}
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: mode === "split" ? "1fr 1fr" : "1fr", overflow: "hidden" }}>
        {mode !== "preview" && <HighlightedTextarea value={mdBody} onChange={e => setMdBody(e.target.value)} c={c} style={{ borderRight: mode === "split" ? `1px solid ${c.line}` : "none" }} />}
        {mode !== "edit" && <div style={{ padding: "1.5rem 2rem", overflowY: "auto", fontFamily: "'DM Sans'", color: c.body, fontSize: "0.95rem", lineHeight: 1.9, background: mode === "preview" ? c.bg : c.surface }}>{renderMarkdown(mdBody, c)}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   EDIT BUTTON
   ═══════════════════════════════════════════ */
function EditButton({ onClick, c }) {
  return <button onClick={onClick} style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 50, background: c.blue, border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${c.blue}44`, fontSize: "1.2rem" }} title="Modifier"
    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
  >✎</button>;
}

/* ═══════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════ */
function Nav({ active, setActive, isAdmin, setIsAdmin, c, mode, toggle, auto, resetAuto, maintenance, setMaintenance }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 3rem", borderBottom: `1px solid ${c.line}`, position: "sticky", top: 0, zIndex: 100, background: c.navBg, backdropFilter: "blur(12px)" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: c.white, cursor: "pointer" }} onClick={() => setActive("Portfolio")}>Gabriel<span style={{ color: c.blue }}>.</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        {["Portfolio", "Blog", "Docs"].map(p => (
          <button key={p} onClick={() => setActive(p)} style={{ background: "none", border: "none", color: active === p ? c.white : c.tertiary, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.9rem", fontWeight: 500, position: "relative", padding: "0.3rem 0", transition: "color 0.3s" }}>
            {p}{active === p && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: c.blue }} />}
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: c.line }} />
        <ThemeToggle mode={mode} toggle={toggle} c={c} auto={auto} resetAuto={resetAuto} />
        <button onClick={() => setIsAdmin(a => !a)} style={{ background: isAdmin ? `${c.green}15` : "transparent", border: `1px solid ${isAdmin ? c.green + "44" : c.line}`, color: isAdmin ? c.green : c.tertiary, padding: "0.3rem 0.8rem", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'DM Sans'", fontWeight: 500, borderRadius: "4px" }}>
          {isAdmin ? "● Admin" : "Login"}
        </button>
        {isAdmin && <>
          <button onClick={() => setMaintenance(m => !m)} style={{ background: maintenance ? "rgba(245,158,11,0.1)" : "transparent", border: `1px solid ${maintenance ? "rgba(245,158,11,0.3)" : c.line}`, color: maintenance ? "#f59e0b" : c.tertiary, padding: "0.3rem 0.8rem", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans'", fontWeight: 500, borderRadius: "4px" }}>
            {maintenance ? "🔧 Maintenance" : "Maintenance"}
          </button>
          <button onClick={() => setActive("Admin Blog")} style={{ background: "none", border: "none", color: active === "Admin Blog" ? c.blueHover : c.tertiary, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.78rem" }}>Admin Blog</button>
          <button onClick={() => setActive("Admin Docs")} style={{ background: "none", border: "none", color: active === "Admin Docs" ? c.blueHover : c.tertiary, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.78rem" }}>Admin Docs</button>
        </>}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   PORTFOLIO VIEW — new layout: full-width hero,
   skills as horizontal bar above, name prominent
   ═══════════════════════════════════════════ */
function PortfolioView({ mdx, isAdmin, onEdit, c, goToDocs, goToBlog }) {
  const { frontmatter: fm, body } = parseMDX(mdx);
  const [hov, setHov] = useState(-1);
  const projects = fm.projects || [], skills = fm.skills || [], stats = fm.stats || [];
  const renderHL = (text) => text ? text.split(/(\*[^*]+\*)/).map((p, i) => p.startsWith("*") && p.endsWith("*") ? <span key={i} style={{ fontStyle: "italic", color: c.blue }}>{p.slice(1, -1)}</span> : p) : null;
  const linkBtn = { background: "none", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.25rem 0.7rem", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans'", borderRadius: "4px", fontWeight: 500, transition: "color 0.2s, border-color 0.2s" };

  return (
    <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "0 3rem" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "4rem", padding: "5rem 0 3rem", position: "relative" }}>
        <p style={{ fontFamily: "'DM Sans'", fontSize: "0.8rem", color: c.blue, letterSpacing: "4px", textTransform: "uppercase", marginBottom: "2rem", fontWeight: 500 }}>{fm.role}</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "6rem", fontWeight: 700, lineHeight: 1, marginBottom: "1.5rem", letterSpacing: "-3px", color: c.white }}>
          {fm.name || "Gabriel"}
        </h1>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 400, color: c.secondary, fontStyle: "italic", marginBottom: "2rem", lineHeight: 1.4 }}>
          {renderHL(fm.headline)}
        </p>
        <p style={{ color: c.secondary, fontSize: "1.05rem", lineHeight: 1.8, fontFamily: "'DM Sans'", maxWidth: 560, margin: "0 auto" }}>{fm.bio}</p>
      </div>

      {/* Skills */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "6rem", justifyContent: "center", flexWrap: "wrap" }}>
        {skills.map((s, i) => (
          <div key={i} style={{ padding: "1rem 1.5rem", borderBottom: `2px solid ${c.line}`, transition: "border-color 0.3s", flex: "1 1 0", minWidth: 160, textAlign: "center" }}
            onMouseEnter={e => e.currentTarget.style.borderBottomColor = c.blue}
            onMouseLeave={e => e.currentTarget.style.borderBottomColor = c.line}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: c.white, marginBottom: "0.2rem" }}>{s.name}</div>
            <div style={{ fontFamily: "'DM Sans'", fontSize: "0.82rem", color: c.tertiary }}>{s.details}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      {projects.length > 0 && <>
        <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: c.white }}>Projets<span style={{ color: c.blue }}>.</span></h2>
          <span style={{ fontFamily: "'DM Sans'", fontSize: "0.8rem", color: c.tertiary }}>{projects.length} projets</span>
        </div>
        <div style={{ borderTop: `1px solid ${c.line}` }}>
          {projects.map((p, i) => (
            <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: "2rem", padding: "2rem 0", borderBottom: `1px solid ${c.line}`, alignItems: "start" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: hov === i ? c.blue : c.decorative, fontStyle: "italic", transition: "color 0.3s" }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.4rem", color: hov === i ? c.blueHover : c.white, transition: "color 0.3s" }}>{p.title}</h3>
                <p style={{ fontFamily: "'DM Sans'", color: c.secondary, fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "0.6rem" }}>{p.description}</p>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {p.blog && <button onClick={(e) => { e.stopPropagation(); goToBlog(p.blog); }} style={linkBtn} onMouseEnter={e => { e.currentTarget.style.color = c.blueHover; e.currentTarget.style.borderColor = c.blue + "44"; }} onMouseLeave={e => { e.currentTarget.style.color = c.tertiary; e.currentTarget.style.borderColor = c.line; }}>Article →</button>}
                  {p.docs && <button onClick={(e) => { e.stopPropagation(); goToDocs(p.docs, null); }} style={linkBtn} onMouseEnter={e => { e.currentTarget.style.color = c.blueHover; e.currentTarget.style.borderColor = c.blue + "44"; }} onMouseLeave={e => { e.currentTarget.style.color = c.tertiary; e.currentTarget.style.borderColor = c.line; }}>Docs →</button>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end", paddingTop: "0.3rem" }}>
                {(Array.isArray(p.tags) ? p.tags : []).map(t => <span key={t} style={{ fontFamily: "'DM Sans'", fontSize: "0.75rem", color: c.tertiary, border: `1px solid ${c.line}`, padding: "0.2rem 0.6rem", borderRadius: "20px" }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </>}

      {/* Stats */}
      {stats.length > 0 && (
        <div style={{ marginTop: "4rem", display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: "2rem", padding: "2.5rem 0", borderTop: `1px solid ${c.line}`, textAlign: "center" }}>
          {stats.map(s => <div key={s.label}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 700, color: c.blue }}>{s.value}</div>
            <div style={{ fontFamily: "'DM Sans'", fontSize: "0.75rem", color: c.tertiary, letterSpacing: "1px", textTransform: "uppercase", marginTop: "0.3rem" }}>{s.label}</div>
          </div>)}
        </div>
      )}

      {/* MDX body */}
      {body && <div style={{ marginTop: "5rem", paddingBottom: "6rem", fontFamily: "'DM Sans'", color: c.body, fontSize: "0.95rem", lineHeight: 1.9 }}>{renderMarkdown(body, c)}</div>}
      {isAdmin && <EditButton onClick={onEdit} c={c} />}
    </div>
  );
}

function PortfolioPage({ mdx, draft, saveDraft, publish, history, restoreHistory, isAdmin, c, goToDocs, goToBlog }) {
  const [editing, setEditing] = useState(false);
  const displayMdx = isAdmin && draft ? draft : mdx;
  if (editing) return <div style={{ height: "calc(100vh - 54px)" }}><MDXEditor mdxContent={draft || mdx} onSave={m => { saveDraft(m); setEditing(false); }} onCancel={() => setEditing(false)} c={c} /></div>;
  return (
    <>
      {isAdmin && draft && (
        <div style={{ background: `${c.blue}08`, borderBottom: `1px solid ${c.blue}22`, padding: "0.5rem 3rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <DraftBadge c={c} />
          <span style={{ fontFamily: "'DM Sans'", fontSize: "0.8rem", color: c.tertiary }}>Des modifications non publiées sont en attente</span>
          <div style={{ flex: 1 }} />
          <GitHistory history={history} c={c} onRestore={restoreHistory} />
          <button onClick={publish} style={{ background: c.green, border: "none", color: "#fff", padding: "0.35rem 1rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.78rem", fontWeight: 600, borderRadius: "4px" }}>Publier</button>
        </div>
      )}
      {isAdmin && !draft && history.length > 0 && (
        <div style={{ background: "transparent", borderBottom: `1px solid ${c.line}`, padding: "0.5rem 3rem", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1rem" }}>
          <GitHistory history={history} c={c} onRestore={restoreHistory} />
        </div>
      )}
      <PortfolioView mdx={displayMdx} isAdmin={isAdmin} onEdit={() => setEditing(true)} c={c} goToDocs={goToDocs} goToBlog={goToBlog} />
    </>
  );
}

/* ═══════════════════════════════════════════
   BLOG
   ═══════════════════════════════════════════ */
/* Search bar component */
function SearchBar({ value, onChange, placeholder, c, style }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <span style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: c.tertiary, fontSize: "0.85rem", pointerEvents: "none" }}>⌕</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Rechercher..."} style={{ width: "100%", background: c.surface, border: `1px solid ${c.line}`, color: c.white, padding: "0.55rem 0.8rem 0.55rem 2.2rem", fontFamily: "'DM Sans'", fontSize: "0.85rem", borderRadius: "6px", outline: "none" }} onFocus={e => e.target.style.borderColor = c.blue} onBlur={e => e.target.style.borderColor = c.line} />
    </div>
  );
}

/* Global doc search — searches across ALL pages */
function DocSearchResults({ query, docs, onNavigate, c }) {
  if (!query || query.length < 2) return null;
  const q = query.toLowerCase();
  const results = [];
  docs.filter(d => d.visible).forEach(d => {
    const lines = d.content.split("\n");
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(q)) {
        // Find nearest heading above this line
        let heading = null;
        for (let j = i; j >= 0; j--) {
          if (lines[j].startsWith("## ")) { heading = lines[j].replace(/^#+\s*/, ""); break; }
        }
        results.push({ doc: d, line: line.replace(/[#*`]/g, "").trim(), heading, lineIndex: i });
      }
    });
    // Also match title
    if (d.title.toLowerCase().includes(q)) {
      results.push({ doc: d, line: d.title, heading: null, lineIndex: 0 });
    }
  });
  if (results.length === 0) return <div style={{ padding: "0.8rem", fontFamily: "'DM Sans'", fontSize: "0.82rem", color: c.tertiary }}>Aucun résultat pour "{query}"</div>;
  // Deduplicate by doc+heading
  const seen = new Set();
  const unique = results.filter(r => {
    const key = `${r.doc.id}-${r.heading || "title"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 15);
  return (
    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.3rem", background: c.surface, border: `1px solid ${c.line}`, borderRadius: "6px", zIndex: 50, maxHeight: 320, overflowY: "auto", boxShadow: `0 8px 24px rgba(0,0,0,0.3)` }}>
      {unique.map((r, i) => (
        <div key={i} onClick={() => onNavigate(r.doc.project, r.doc.id)} style={{ padding: "0.6rem 1rem", cursor: "pointer", borderBottom: `1px solid ${c.line}`, transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = `${c.blue}10`}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.15rem" }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: "0.68rem", color: c.blue, fontWeight: 500 }}>{r.doc.project}</span>
            <span style={{ color: c.line }}>›</span>
            <span style={{ fontFamily: "'DM Sans'", fontSize: "0.68rem", color: c.tertiary }}>{r.doc.title}</span>
            {r.heading && <><span style={{ color: c.line }}>›</span><span style={{ fontFamily: "'DM Sans'", fontSize: "0.68rem", color: c.tertiary }}>{r.heading}</span></>}
          </div>
          <div style={{ fontFamily: "'DM Sans'", fontSize: "0.8rem", color: c.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.line}</div>
        </div>
      ))}
    </div>
  );
}

function BlogPage({ posts, setPosts, saveDraft, publishPost, isAdmin, c, goToDocs, initialView }) {
  const [viewing, setViewing] = useState(initialView || null);
  const [editing, setEditing] = useState(null);
  const [hov, setHov] = useState(-1);
  const [search, setSearch] = useState("");
  const post = viewing ? posts.find(p => p.id === viewing) : null;

  if (editing && post) return <div style={{ height: "calc(100vh - 54px)" }}><MarkdownEditor content={post.draft || post.content} title={post.title} onTitleChange={t => setPosts(ps => ps.map(p => p.id === editing ? { ...p, title: t } : p))} onSave={md => { saveDraft(editing, md); setEditing(null); }} onCancel={() => setEditing(null)} c={c} /></div>;

  if (post) {
    const displayContent = isAdmin && post.draft ? post.draft : post.content;
    const toc = extractTOC(displayContent);
    return (
      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "4rem 3rem 8rem" }}>
        <button onClick={() => setViewing(null)} style={{ background: "none", border: "none", color: c.tertiary, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.85rem", marginBottom: "2rem" }} onMouseEnter={e => e.currentTarget.style.color = c.blueHover} onMouseLeave={e => e.currentTarget.style.color = c.tertiary}>← Retour</button>
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.2rem" }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: "0.78rem", color: c.blue, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>{post.cat}</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.tertiary }} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: "0.82rem", color: c.tertiary }}>{post.date} · {post.time}</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.8rem", fontWeight: 700, lineHeight: 1.2, color: c.white, marginBottom: "1.5rem" }}>{post.title}</h1>
          <p style={{ fontFamily: "'DM Sans'", color: c.secondary, fontSize: "1.1rem", lineHeight: 1.8, fontStyle: "italic" }}>{post.excerpt}</p>
          {post.docProject && <button onClick={() => goToDocs(post.docProject, null)} style={{ marginTop: "1rem", background: `${c.blue}08`, border: `1px solid ${c.blue}25`, color: c.blueHover, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'DM Sans'", borderRadius: "5px", fontWeight: 500, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = `${c.blue}15`} onMouseLeave={e => e.currentTarget.style.background = `${c.blue}08`}>Documentation {post.docProject} →</button>}
        </div>
        {toc.length > 0 && <div style={{ padding: "1.2rem 1.5rem", background: c.surface, border: `1px solid ${c.line}`, borderRadius: "6px", marginBottom: "3rem" }}>
          <h4 style={{ fontFamily: "'DM Sans'", fontSize: "0.72rem", color: c.tertiary, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "0.8rem", fontWeight: 500 }}>Sommaire</h4>
          {toc.map((t, i) => <div key={i} style={{ fontFamily: "'DM Sans'", fontSize: "0.88rem", color: c.blueHover, marginBottom: "0.3rem", cursor: "pointer" }}>{t}</div>)}
        </div>}
        <div style={{ fontFamily: "'DM Sans'", color: c.body, fontSize: "1rem", lineHeight: 1.9 }}>{renderMarkdown(displayContent, c)}</div>
        {isAdmin && (
          <div style={{ marginTop: "3rem", padding: "1rem 0", borderTop: `1px solid ${c.line}`, display: "flex", alignItems: "center", gap: "1rem" }}>
            {post.draft && <><DraftBadge c={c} /><button onClick={() => publishPost(post.id)} style={{ background: c.green, border: "none", color: "#fff", padding: "0.35rem 1rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.78rem", fontWeight: 600, borderRadius: "4px" }}>Publier</button></>}
            <div style={{ flex: 1 }} />
            <GitHistory history={post.history} c={c} onRestore={(h) => { if (h.content && confirm("Restaurer ?")) saveDraft(post.id, h.content); }} />
            <EditButton onClick={() => setEditing(post.id)} c={c} />
          </div>
        )}
      </div>
    );
  }

  const q = search.toLowerCase();
  const filtered = posts.filter(p => p.visible && (!q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)));

  return (
    <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "6rem 3rem 8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 700, marginBottom: "0.5rem", color: c.white }}>Journal<span style={{ color: c.blue }}>.</span></h1>
          <p style={{ fontFamily: "'DM Sans'", color: c.secondary, fontSize: "1rem" }}>Notes techniques et retours d'expérience.</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un article..." c={c} style={{ width: 260 }} />
      </div>
      {filtered.length === 0 && <p style={{ fontFamily: "'DM Sans'", color: c.tertiary, fontSize: "0.95rem" }}>Aucun article trouvé pour "{search}".</p>}
      {filtered.map((p, i) => (
        <article key={p.id} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)} onClick={() => setViewing(p.id)} style={{ marginBottom: "4rem", cursor: "pointer", paddingBottom: "4rem", borderBottom: `1px solid ${c.line}` }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: "0.78rem", color: c.blue, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>{p.cat}</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.tertiary }} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: "0.82rem", color: c.tertiary }}>{p.date}</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, marginBottom: "0.8rem", color: hov === i ? c.blueHover : c.white, transition: "color 0.3s", lineHeight: 1.3 }}>{p.title}</h2>
          <p style={{ fontFamily: "'DM Sans'", color: c.secondary, fontSize: "1rem", lineHeight: 1.8 }}>{p.excerpt}</p>
          <span style={{ fontFamily: "'DM Sans'", fontSize: "0.82rem", color: c.tertiary, marginTop: "0.8rem", display: "inline-block" }}>{p.time} →</span>
        </article>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DOCS — with project selector and global search
   ═══════════════════════════════════════════ */
function DocPage({ docs, setDocs, saveDraft, publishDoc, isAdmin, c, initialNav }) {
  const [activeProject, setActiveProject] = useState(initialNav?.project || null);
  const [activeId, setActiveId] = useState(initialNav?.docId || null);
  const [editing, setEditing] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const lastNav = useRef(initialNav);

  // Handle cross-navigation from other pages
  useEffect(() => {
    if (initialNav && (initialNav.project !== lastNav.current?.project || initialNav.docId !== lastNav.current?.docId)) {
      lastNav.current = initialNav;
      if (initialNav.project) setActiveProject(initialNav.project);
      if (initialNav.docId) setActiveId(initialNav.docId);
    }
  }, [initialNav]);

  // Set first doc when entering a project without specific docId
  useEffect(() => {
    if (activeProject && !activeId) {
      const first = docs.find(d => d.project === activeProject && d.visible);
      if (first) setActiveId(first.id);
    }
  }, [activeProject, activeId, docs]);

  // Available projects (from visible docs)
  const projects = [...new Set(docs.filter(d => d.visible).map(d => d.project))];

  // Project selection screen
  if (!activeProject) {
    return (
      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "6rem 3rem 8rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 700, marginBottom: "0.5rem", color: c.white }}>Documentation<span style={{ color: c.blue }}>.</span></h1>
        <p style={{ fontFamily: "'DM Sans'", color: c.secondary, fontSize: "1rem", marginBottom: "2rem" }}>Sélectionnez un projet pour accéder à sa documentation.</p>
        <div style={{ position: "relative", marginBottom: "3rem" }}>
          <SearchBar value={globalSearch} onChange={setGlobalSearch} placeholder="Rechercher dans toute la documentation..." c={c} />
          <DocSearchResults query={globalSearch} docs={docs} c={c} onNavigate={(proj, docId) => { setActiveProject(proj); setActiveId(docId); setGlobalSearch(""); }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {projects.map(proj => {
            const projDocs = docs.filter(d => d.project === proj && d.visible);
            const sectionCount = new Set(projDocs.map(d => d.section)).size;
            return (
              <div key={proj} onClick={() => { setActiveProject(proj); setActiveId(projDocs[0]?.id); }} style={{ padding: "1.5rem", border: `1px solid ${c.line}`, borderRadius: "8px", cursor: "pointer", transition: "border-color 0.2s, background 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.blue + "44"; e.currentTarget.style.background = `${c.blue}08`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.line; e.currentTarget.style.background = "transparent"; }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 600, color: c.white, marginBottom: "0.4rem" }}>{proj}</h3>
                <p style={{ fontFamily: "'DM Sans'", fontSize: "0.8rem", color: c.tertiary }}>{projDocs.length} pages · {sectionCount} sections</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Doc viewer for selected project
  const projectDocs = docs.filter(d => d.project === activeProject && d.visible);
  const projectSections = docSectionsOrder.map(t => ({ title: t, items: projectDocs.filter(d => d.section === t) })).filter(s => s.items.length > 0);
  const ad = docs.find(d => d.id === activeId);
  const docDisplayContent = ad ? (isAdmin && ad.draft ? ad.draft : ad.content) : "";
  const toc = ad ? extractTOC(docDisplayContent) : [];

  if (editing && ad) return <div style={{ height: "calc(100vh - 54px)" }}><MarkdownEditor content={ad.draft || ad.content} title={ad.title} onTitleChange={t => setDocs(ds => ds.map(d => d.id === editing ? { ...d, title: t } : d))} onSave={md => { saveDraft(editing, md); setEditing(null); }} onCancel={() => setEditing(null)} c={c} /></div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 170px", flex: 1, overflow: "hidden" }}>
      <aside style={{ padding: "1.5rem 1.2rem", borderRight: `1px solid ${c.line}`, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <button onClick={() => { setActiveProject(null); setActiveId(null); }} style={{ background: "none", border: "none", color: c.tertiary, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.78rem", marginBottom: "1rem", textAlign: "left", padding: 0 }} onMouseEnter={e => e.currentTarget.style.color = c.blueHover} onMouseLeave={e => e.currentTarget.style.color = c.tertiary}>← Tous les projets</button>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, color: c.white, marginBottom: "1rem" }}>{activeProject}</h3>
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <SearchBar value={globalSearch} onChange={setGlobalSearch} placeholder="Recherche globale..." c={c} />
          <DocSearchResults query={globalSearch} docs={docs} c={c} onNavigate={(proj, docId) => { setActiveProject(proj); setActiveId(docId); setGlobalSearch(""); }} />
        </div>
        {projectSections.map(s => <div key={s.title} style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", color: c.white, marginBottom: "0.5rem", fontWeight: 600 }}>{s.title}</h4>
          {s.items.map(item => <div key={item.id} onClick={() => setActiveId(item.id)} style={{ padding: "0.3rem 0", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'DM Sans'", color: activeId === item.id ? c.blueHover : c.tertiary, fontWeight: activeId === item.id ? 500 : 400, borderLeft: `2px solid ${activeId === item.id ? c.blue : "transparent"}`, paddingLeft: "0.8rem", transition: "color 0.2s, border-color 0.2s" }}>{item.title}</div>)}
        </div>)}
      </aside>
      <main style={{ padding: "3rem 3.5rem 6rem", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: "0.3rem", marginBottom: "2.5rem", fontFamily: "'DM Sans'", fontSize: "0.8rem" }}>
          {[activeProject, ad?.section, ad?.title].filter(Boolean).map((b, i, a) => <span key={i} style={{ color: i === a.length - 1 ? c.blueHover : c.tertiary }}>{b}{i < a.length - 1 && <span style={{ margin: "0 0.4rem", color: c.line }}>›</span>}</span>)}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 700, marginBottom: "2rem", color: c.white }}>{ad?.title}<span style={{ color: c.blue }}>.</span></h1>
        <div style={{ fontFamily: "'DM Sans'", color: c.body, lineHeight: 1.9, fontSize: "0.95rem" }}>{ad && renderMarkdown(docDisplayContent, c)}</div>
        {isAdmin && ad && (
          <div style={{ marginTop: "3rem", padding: "1rem 0", borderTop: `1px solid ${c.line}`, display: "flex", alignItems: "center", gap: "1rem" }}>
            {ad.draft && <><DraftBadge c={c} /><button onClick={() => publishDoc(ad.id)} style={{ background: c.green, border: "none", color: "#fff", padding: "0.35rem 1rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.78rem", fontWeight: 600, borderRadius: "4px" }}>Publier</button></>}
            <div style={{ flex: 1 }} />
            <GitHistory history={ad.history} c={c} onRestore={(h) => { if (h.content && confirm("Restaurer ?")) saveDraft(ad.id, h.content); }} />
            <EditButton onClick={() => setEditing(activeId)} c={c} />
          </div>
        )}
      </main>
      <aside style={{ borderLeft: `1px solid ${c.line}`, padding: "3rem 1.2rem", overflowY: "auto" }}>
        <h4 style={{ fontFamily: "'DM Sans'", fontSize: "0.7rem", color: c.tertiary, letterSpacing: "1.5px", marginBottom: "1rem", textTransform: "uppercase", fontWeight: 500 }}>Sur cette page</h4>
        {toc.map((t, i) => <div key={t} style={{ fontSize: "0.85rem", color: i === 0 ? c.blueHover : c.tertiary, marginBottom: "0.6rem", cursor: "pointer", fontFamily: "'DM Sans'", paddingLeft: "0.8rem", borderLeft: `1px solid ${i === 0 ? c.blue : "transparent"}` }}>{t}</div>)}
      </aside>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADMIN PANELS
   ═══════════════════════════════════════════ */
/* Hover Button — independent hover state */
function HoverBtn({ onClick, label, baseStyle, hoverStyle, children }) {
  const ref = useRef(null);
  const enter = () => { if (ref.current) Object.assign(ref.current.style, hoverStyle); };
  const leave = () => { if (ref.current) Object.assign(ref.current.style, baseStyle); };
  return <button ref={ref} onClick={onClick} onMouseEnter={enter} onMouseLeave={leave} style={baseStyle}>{children || label}</button>;
}

/* Visibility Toggle */
function VisToggle({ visible, onChange, c }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.75rem", color: visible ? c.green : c.tertiary, userSelect: "none", transition: "color 0.2s" }}>
      <div onClick={onChange} style={{ width: 18, height: 18, borderRadius: "4px", border: `1.5px solid ${visible ? c.green : c.line}`, background: visible ? `${c.green}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}>
        {visible && <span style={{ color: c.green, fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
      </div>
      {visible ? "Visible" : "Brouillon"}
    </label>
  );
}

/* Git History Panel */
function GitHistory({ history, onRestore, c }) {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return <span style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.68rem", color: c.tertiary }}>0 commits</span>;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.25rem 0.6rem", cursor: "pointer", fontSize: "0.68rem", fontFamily: "'JetBrains Mono'", borderRadius: "4px", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.3rem" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = c.blue + "44"; e.currentTarget.style.color = c.blueHover; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = c.line; e.currentTarget.style.color = c.tertiary; } }}>
        <span style={{ fontSize: "0.75rem" }}>⎇</span> {history.length} commit{history.length > 1 ? "s" : ""}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.4rem", background: c.surface, border: `1px solid ${c.line}`, borderRadius: "6px", padding: "0.6rem", width: 300, zIndex: 20, boxShadow: `0 8px 24px rgba(0,0,0,0.3)` }}>
          <div style={{ fontFamily: "'DM Sans'", fontSize: "0.7rem", color: c.tertiary, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 500 }}>Historique des versions</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: i < history.length - 1 ? `1px solid ${c.line}` : "none" }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.7rem", color: c.blueHover }}>{h.date}</div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: "0.75rem", color: c.body }}>{h.summary}</div>
              </div>
              {i > 0 && onRestore && <button onClick={() => { onRestore(h); setOpen(false); }} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.65rem", fontFamily: "'DM Sans'", borderRadius: "3px" }}>Restaurer</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminBlog({ posts, setPosts, saveDraft, publishPost, c }) {
  const [editing, setEditing] = useState(null);
  const post = editing ? posts.find(p => p.id === editing) : null;
  if (post) return <div style={{ height: "calc(100vh - 54px)" }}><MarkdownEditor content={post.draft || post.content} title={post.title} onTitleChange={t => setPosts(ps => ps.map(p => p.id === editing ? { ...p, title: t } : p))} onSave={md => {
    saveDraft(editing, md);
    setEditing(null);
  }} onCancel={() => setEditing(null)} c={c} /></div>;

  const deletePost = (id) => { if (confirm("Supprimer cet article ?")) setPosts(ps => ps.filter(p => p.id !== id)); };
  const toggleVis = (id) => setPosts(ps => ps.map(p => p.id === id ? { ...p, visible: !p.visible } : p));

  const editBtn = { background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.35rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", borderRadius: "4px", transition: "color 0.2s, background 0.2s, border-color 0.2s" };
  const editBtnHov = { background: `${c.blue}15`, borderColor: c.blue + "44", color: c.blueHover };
  const delBtn = { ...editBtn, padding: "0.35rem 0.8rem" };
  const delBtnHov = { background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)", color: c.red };

  return (
    <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "0 3rem" }}>
      <div style={{ padding: "4rem 0 8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: c.white }}>Admin Blog<span style={{ color: c.blue }}>.</span></h1>
            <p style={{ fontFamily: "'DM Sans'", color: c.tertiary, fontSize: "0.88rem", marginTop: "0.3rem" }}>{posts.length} articles · {posts.filter(p => p.visible).length} publiés</p>
          </div>
          <button onClick={() => { const np = { id: `n${Date.now()}`, title: "Nouvel article", date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), cat: "Draft", time: "? min", excerpt: "...", content: "Commencez à écrire...", visible: false, docProject: null, draft: null, history: [] }; setPosts(ps => [np, ...ps]); setEditing(np.id); }} style={{ background: c.blue, border: "none", color: "#fff", padding: "0.6rem 1.5rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.85rem", fontWeight: 600, borderRadius: "6px" }}>+ Nouvel article</button>
        </div>
        <div style={{ borderTop: `1px solid ${c.line}` }}>
          {posts.map((p) => (
            <div key={p.id} style={{ padding: "1.2rem 0", borderBottom: `1px solid ${c.line}` }}>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.3rem" }}>
                <span style={{ fontFamily: "'DM Sans'", fontSize: "0.7rem", color: c.blue, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>{p.cat}</span>
                <span style={{ fontFamily: "'DM Sans'", fontSize: "0.75rem", color: c.tertiary }}>{p.date}</span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.7rem", color: c.tertiary }}>{p.content.length}c</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, color: p.visible ? c.white : c.tertiary, transition: "color 0.2s", marginBottom: "0.6rem" }}>{p.title}</h3>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <VisToggle visible={p.visible} onChange={() => toggleVis(p.id)} c={c} />
                {p.draft && <><DraftBadge c={c} /><button onClick={() => publishPost(p.id)} style={{ background: c.green, border: "none", color: "#fff", padding: "0.2rem 0.7rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.7rem", fontWeight: 600, borderRadius: "3px" }}>Publier</button></>}
                <div style={{ flex: 1 }} />
                <GitHistory history={p.history} c={c} onRestore={(h) => { if (h.content && confirm("Restaurer cette version ?")) saveDraft(p.id, h.content); }} />
                <HoverBtn onClick={() => setEditing(p.id)} baseStyle={editBtn} hoverStyle={editBtnHov} label="Éditer" />
                <HoverBtn onClick={() => deletePost(p.id)} baseStyle={delBtn} hoverStyle={delBtnHov} label="Supprimer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDocs({ docs, setDocs, saveDraft, publishDoc, c }) {
  const [editing, setEditing] = useState(null);
  const [newSection, setNewSection] = useState("");
  const [showNewSection, setShowNewSection] = useState(false);
  const [activeProject, setActiveProject] = useState(docProjects[0] || "UniDash");
  const [newProject, setNewProject] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const doc = editing ? docs.find(d => d.id === editing) : null;
  if (doc) return <div style={{ height: "calc(100vh - 54px)" }}><MarkdownEditor content={doc.draft || doc.content} title={doc.title} onTitleChange={t => setDocs(ds => ds.map(d => d.id === editing ? { ...d, title: t } : d))} onSave={md => {
    saveDraft(editing, md);
    setEditing(null);
  }} onCancel={() => setEditing(null)} c={c} /></div>;

  const projectDocs = docs.filter(d => d.project === activeProject);
  const sectionNames = [...new Set(projectDocs.map(d => d.section))];
  const sections = sectionNames.map(t => ({ title: t, items: projectDocs.filter(d => d.section === t) }));
  const allProjects = [...new Set(docs.map(d => d.project))];

  const deleteDoc = (id) => { if (confirm("Supprimer cette page ?")) setDocs(ds => ds.filter(d => d.id !== id)); };
  const deleteSection = (title) => { if (confirm(`Supprimer "${title}" et toutes ses pages ?`)) setDocs(ds => ds.filter(d => !(d.section === title && d.project === activeProject))); };
  const addPageToSection = (title) => { const nd = { id: `n${Date.now()}`, project: activeProject, section: title, title: "Nouvelle page", content: "Commencez à écrire...", visible: false, draft: null, history: [] }; setDocs(ds => [...ds, nd]); setEditing(nd.id); };
  const toggleVis = (id) => setDocs(ds => ds.map(d => d.id === id ? { ...d, visible: !d.visible } : d));
  const addSection = () => { if (!newSection.trim()) return; const nd = { id: `n${Date.now()}`, project: activeProject, section: newSection.trim(), title: "Première page", content: "Commencez à écrire...", visible: false, draft: null, history: [] }; setDocs(ds => [...ds, nd]); setNewSection(""); setShowNewSection(false); setEditing(nd.id); };
  const addProject = () => { if (!newProject.trim()) return; const nd = { id: `n${Date.now()}`, project: newProject.trim(), section: "Démarrage", title: "Introduction", content: "Commencez à écrire...", visible: false, draft: null, history: [] }; setDocs(ds => [...ds, nd]); setActiveProject(newProject.trim()); setNewProject(""); setShowNewProject(false); setEditing(nd.id); };

  const editBtn = { background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.35rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'DM Sans'", borderRadius: "4px", transition: "color 0.2s, background 0.2s, border-color 0.2s" };
  const editBtnHov = { background: `${c.blue}15`, borderColor: c.blue + "44", color: c.blueHover };
  const delBtn = { ...editBtn, padding: "0.35rem 0.8rem" };
  const delBtnHov = { background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)", color: c.red };

  return (
    <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "0 3rem" }}>
      <div style={{ padding: "4rem 0 8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: c.white }}>Admin Documentation<span style={{ color: c.blue }}>.</span></h1>
            <p style={{ fontFamily: "'DM Sans'", color: c.tertiary, fontSize: "0.88rem", marginTop: "0.3rem" }}>{projectDocs.length} pages · {sectionNames.length} sections · {projectDocs.filter(d => d.visible).length} publiées</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {showNewProject ? (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input value={newProject} onChange={e => setNewProject(e.target.value)} placeholder="Nom du projet" onKeyDown={e => e.key === "Enter" && addProject()} style={{ background: c.bg, border: `1px solid ${c.line}`, color: c.white, padding: "0.5rem 0.8rem", fontFamily: "'DM Sans'", fontSize: "0.85rem", borderRadius: "4px", outline: "none", width: 180 }} onFocus={e => e.target.style.borderColor = c.blue} onBlur={e => e.target.style.borderColor = c.line} autoFocus />
                <button onClick={addProject} style={{ background: c.blue, border: "none", color: "#fff", padding: "0.5rem 1rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.82rem", fontWeight: 600, borderRadius: "4px" }}>Créer</button>
                <button onClick={() => setShowNewProject(false)} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.5rem 0.8rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.82rem", borderRadius: "4px" }}>×</button>
              </div>
            ) : (
              <HoverBtn onClick={() => setShowNewProject(true)} baseStyle={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.6rem 1.2rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.85rem", borderRadius: "6px", transition: "color 0.2s, background 0.2s, border-color 0.2s" }} hoverStyle={{ borderColor: c.blue + "44", color: c.blueHover }} label="+ Projet" />
            )}
          </div>
        </div>

        {/* Project tabs */}
        <div style={{ display: "flex", gap: "0.3rem", marginBottom: "2.5rem", borderBottom: `1px solid ${c.line}`, paddingBottom: "0.5rem" }}>
          {allProjects.map(proj => (
            <button key={proj} onClick={() => setActiveProject(proj)} style={{ background: activeProject === proj ? `${c.blue}12` : "transparent", border: `1px solid ${activeProject === proj ? c.blue + "44" : "transparent"}`, color: activeProject === proj ? c.blueHover : c.tertiary, padding: "0.4rem 1rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.82rem", fontWeight: 500, borderRadius: "4px", transition: "color 0.2s, background 0.2s" }}>{proj}<span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", opacity: 0.6 }}>{docs.filter(d => d.project === proj).length}</span></button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {showNewSection ? (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="Nom de la section" onKeyDown={e => e.key === "Enter" && addSection()} style={{ background: c.bg, border: `1px solid ${c.line}`, color: c.white, padding: "0.5rem 0.8rem", fontFamily: "'DM Sans'", fontSize: "0.85rem", borderRadius: "4px", outline: "none", width: 200 }} onFocus={e => e.target.style.borderColor = c.blue} onBlur={e => e.target.style.borderColor = c.line} autoFocus />
                <button onClick={addSection} style={{ background: c.blue, border: "none", color: "#fff", padding: "0.5rem 1rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.82rem", fontWeight: 600, borderRadius: "4px" }}>Créer</button>
                <button onClick={() => setShowNewSection(false)} style={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.5rem 0.8rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.82rem", borderRadius: "4px" }}>×</button>
              </div>
            ) : (
              <HoverBtn onClick={() => setShowNewSection(true)} baseStyle={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.6rem 1.2rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.85rem", borderRadius: "6px", transition: "color 0.2s, background 0.2s, border-color 0.2s" }} hoverStyle={{ borderColor: c.blue + "44", color: c.blueHover }} label="+ Section" />
            )}
          </div>
        </div>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${c.line}` }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 600, color: c.white }}>{s.title}</h2>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button onClick={() => addPageToSection(s.title)} style={{ background: `${c.blue}10`, border: `1px dashed ${c.blue}44`, color: c.blueHover, padding: "0.25rem 0.8rem", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans'", borderRadius: "4px" }}>+ Page</button>
                <HoverBtn onClick={() => deleteSection(s.title)} baseStyle={{ background: "transparent", border: `1px solid ${c.line}`, color: c.tertiary, padding: "0.25rem 0.8rem", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'DM Sans'", borderRadius: "4px", transition: "color 0.2s, background 0.2s, border-color 0.2s" }} hoverStyle={{ borderColor: "rgba(248,113,113,0.3)", color: c.red }} label="Supprimer section" />
              </div>
            </div>
            {s.items.map(d => (
              <div key={d.id} style={{ padding: "0.8rem 0", borderBottom: `1px solid ${c.line}08` }}>
                <h3 style={{ fontFamily: "'DM Sans'", fontSize: "0.95rem", fontWeight: 500, color: d.visible ? c.white : c.tertiary, transition: "color 0.2s", marginBottom: "0.4rem" }}>{d.title}</h3>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <VisToggle visible={d.visible} onChange={() => toggleVis(d.id)} c={c} />
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.7rem", color: c.tertiary }}>{d.content.length}c</span>
                  {d.draft && <><DraftBadge c={c} /><button onClick={() => publishDoc(d.id)} style={{ background: c.green, border: "none", color: "#fff", padding: "0.2rem 0.7rem", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "0.7rem", fontWeight: 600, borderRadius: "3px" }}>Publier</button></>}
                  <div style={{ flex: 1 }} />
                  <GitHistory history={d.history} c={c} onRestore={(h) => { if (h.content && confirm("Restaurer ?")) saveDraft(d.id, h.content); }} />
                  <HoverBtn onClick={() => setEditing(d.id)} baseStyle={editBtn} hoverStyle={editBtnHov} label="Éditer" />
                  <HoverBtn onClick={() => deleteDoc(d.id)} baseStyle={delBtn} hoverStyle={delBtnHov} label="Supprimer" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAINTENANCE PAGE
   ═══════════════════════════════════════════ */
function MaintenancePage({ c }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "4rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🔧</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 700, color: c.white, marginBottom: "1rem" }}>Maintenance en cours<span style={{ color: c.blue }}>.</span></h1>
      <p style={{ fontFamily: "'DM Sans'", color: c.secondary, fontSize: "1.05rem", lineHeight: 1.8, maxWidth: 480 }}>Le site est temporairement indisponible pour maintenance. Revenez bientôt !</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DRAFT/PUBLISH BADGE
   ═══════════════════════════════════════════ */
function DraftBadge({ c }) {
  return <span style={{ display: "inline-block", fontFamily: "'DM Sans'", fontSize: "0.65rem", fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", padding: "0.1rem 0.5rem", borderRadius: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Brouillon</span>;
}

/* ═══════════════════════════════════════════
   TIMESTAMP HELPER
   ═══════════════════════════════════════════ */
function nowStr() { return new Date().toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

/* ═══════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("Portfolio");
  const [isAdmin, setIsAdmin] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [portfolioMDX, setPortfolioMDX] = useState(defaultPortfolioMDX);
  const [portfolioDraft, setPortfolioDraft] = useState(null);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [posts, setPosts] = useState(defaultPosts);
  const [docs, setDocs] = useState(defaultDocs);
  const { c, mode, toggle, auto, resetAuto } = useTheme();

  // Cross-navigation state
  const [docNav, setDocNav] = useState({ project: null, docId: null });
  const [blogNav, setBlogNav] = useState(null);

  const goToDocs = (project, docId) => { setDocNav({ project, docId }); setPage("Docs"); };
  const goToBlog = (postId) => { setBlogNav(postId); setPage("Blog"); };

  // Draft/Publish helpers for portfolio
  const savePortfolioDraft = (mdx) => {
    setPortfolioHistory(h => [{ date: nowStr(), summary: "Modification", content: portfolioDraft || portfolioMDX }, ...h]);
    setPortfolioDraft(mdx);
  };
  const publishPortfolio = () => { if (portfolioDraft) { setPortfolioMDX(portfolioDraft); setPortfolioDraft(null); } };
  const restorePortfolio = (h) => { if (h.content && confirm("Restaurer cette version ?")) setPortfolioDraft(h.content); };

  // Draft/Publish helpers for posts
  const savePostDraft = (id, md) => {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, draft: md, history: [{ date: nowStr(), summary: "Modification", content: p.draft || p.content }, ...(p.history || [])] } : p));
  };
  const publishPost = (id) => { setPosts(ps => ps.map(p => p.id === id ? { ...p, content: p.draft, draft: null } : p)); };

  // Draft/Publish helpers for docs
  const saveDocDraft = (id, md) => {
    setDocs(ds => ds.map(d => d.id === id ? { ...d, draft: md, history: [{ date: nowStr(), summary: "Modification", content: d.draft || d.content }, ...(d.history || [])] } : d));
  };
  const publishDoc = (id) => { setDocs(ds => ds.map(d => d.id === id ? { ...d, content: d.draft, draft: null } : d)); };

  // Maintenance guard
  if (maintenance && !isAdmin) return (
    <div style={{ background: c.bg, color: c.white, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');*{margin:0;padding:0;box-sizing:border-box}`}</style>
      <MaintenancePage c={c} />
    </div>
  );

  return (
    <div style={{ background: c.bg, color: c.white, transition: "background 0.3s, color 0.3s", display: "flex", flexDirection: "column", height: page === "Docs" ? "100vh" : "auto", minHeight: "100vh", overflow: page === "Docs" ? "hidden" : "auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');*{margin:0;padding:0;box-sizing:border-box;transition:background-color 0.3s,border-color 0.3s}::selection{background:rgba(59,130,246,0.3)}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${c.bg}}::-webkit-scrollbar-thumb{background:${c.line};border-radius:4px}textarea::-webkit-scrollbar{width:4px}textarea::-webkit-scrollbar-track{background:${c.bg}}textarea::-webkit-scrollbar-thumb{background:${c.line}}code{font-family:'JetBrains Mono',monospace}`}</style>
      {maintenance && isAdmin && <div style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.3)", padding: "0.4rem 3rem", textAlign: "center" }}>
        <span style={{ fontFamily: "'DM Sans'", fontSize: "0.78rem", color: "#f59e0b", fontWeight: 500 }}>🔧 Mode maintenance actif — le site est masqué au public</span>
      </div>}
      <Nav active={page} setActive={p => { setPage(p); if (p !== "Docs") setDocNav({ project: null, docId: null }); if (p !== "Blog") setBlogNav(null); }} isAdmin={isAdmin} setIsAdmin={setIsAdmin} c={c} mode={mode} toggle={toggle} auto={auto} resetAuto={resetAuto} maintenance={maintenance} setMaintenance={setMaintenance} />
      {page === "Portfolio" && <PortfolioPage mdx={portfolioMDX} draft={portfolioDraft} saveDraft={savePortfolioDraft} publish={publishPortfolio} history={portfolioHistory} restoreHistory={restorePortfolio} isAdmin={isAdmin} c={c} goToDocs={goToDocs} goToBlog={goToBlog} />}
      {page === "Blog" && <BlogPage posts={posts} setPosts={setPosts} saveDraft={savePostDraft} publishPost={publishPost} isAdmin={isAdmin} c={c} goToDocs={goToDocs} initialView={blogNav} />}
      {page === "Docs" && <DocPage docs={docs} setDocs={setDocs} saveDraft={saveDocDraft} publishDoc={publishDoc} isAdmin={isAdmin} c={c} initialNav={docNav} />}
      {page === "Admin Blog" && <AdminBlog posts={posts} setPosts={setPosts} saveDraft={savePostDraft} publishPost={publishPost} c={c} />}
      {page === "Admin Docs" && <AdminDocs docs={docs} setDocs={setDocs} saveDraft={saveDocDraft} publishDoc={publishDoc} c={c} />}
    </div>
  );
}
