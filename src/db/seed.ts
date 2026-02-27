import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import * as schema from "./schema";

// Ensure data directory exists
mkdirSync("data", { recursive: true });

const sqlite = new Database("data/portfolio.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

const now = new Date().toISOString();

// ─── Portfolio MDX (canonical from JSX prototype) ───

const defaultPortfolioMDX = `---
name: Gabriel Guillou
title: Gabriel Guillou
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
  - title: uni-dash
    description: Orchestration cloud self-hosted avec monitoring intégré et interface de gestion complète
    tags: [Docker, Vue.js, Python]
    docs: uni-dash
  - title: astral-emu
    description: Distribution Linux complète dédiée à l'émulation retro gaming avec builders dynamiques
    tags: [Linux, Bash, CI/CD]
    docs: astral-emu
  - title: centrarr
    description: Serveur média avec authentification WebAuthn passkeys et gestion multi-utilisateurs
    tags: [Auth, Node.js, SQLite]
    blog: webauthn-node
    docs: centrarr
  - title: isol-app
    description: Système d'orchestration Docker en environnements chroot isolés haute performance
    tags: [Docker, Nginx, Bash]
    blog: docker-compose-quit
    docs: isol-app

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

// ─── Blog posts (canonical from JSX prototype) ───

const defaultPosts = [
  {
    id: "docker-compose-quit",
    title: "Pourquoi j'ai quitté Docker Compose",
    date: "15 Décembre 2025",
    cat: "DevOps",
    time: "8 min de lecture",
    visible: true,
    sortOrder: 0,
    docProject: "isol-app",
    draft: null,
    excerpt:
      "Après 3 ans d'utilisation intensive, voici pourquoi j'ai développé ma propre solution d'orchestration conteneurisée.",
    content: `Docker Compose m'a accompagné pendant 3 ans. Chaque projet passait par un \`docker-compose.yml\`. Jusqu'au jour où ça n'a plus suffi.

## Le point de rupture

Tout a commencé quand j'ai voulu déployer une quinzaine de services sur un même serveur, chacun avec son propre réseau isolé. Le fichier Compose est devenu un monstre de 800 lignes. Le vrai problème n'était pas la taille — c'était le **manque de contrôle**.

- Du routing réseau fin entre conteneurs isolés
- Des healthchecks personnalisés avec retry logic
- Du hot-reload de configuration sans restart
- De la gestion de secrets qui ne soit pas du bind mount en clair

## La solution : isol-app

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

## Architecture comparée

\`\`\`mermaid
graph LR
    A[Docker Compose] -->|docker-compose.yml| B[Docker Daemon]
    B --> C[Container 1]
    B --> D[Container 2]
    B --> E[Container N]

    F[isol-app] -->|CLI directe| G[systemd-nspawn]
    F -->|cgroups v2| H[Isolation réseau]
    G --> I[Container 1]
    G --> J[Container 2]
    H --> I
    H --> J

    style A fill:#e74c3c,color:#fff
    style F fill:#3b82f6,color:#fff
\`\`\`

## Recommandation

**Non**, ne quittez pas Compose si vous avez moins de 10 services. Mais si vous gérez un homelab complexe et avez une allergie aux boîtes noires : écrire votre propre solution paie.`,
    history: [
      {
        date: "15 Déc 2025 10:30",
        summary: "Publication initiale",
        content: "...",
      },
    ],
  },
  {
    id: "zfs-proxmox",
    title: "ZFS sur Proxmox : le guide complet",
    date: "28 Novembre 2025",
    cat: "Sysadmin",
    time: "12 min",
    visible: true,
    sortOrder: 1,
    docProject: null,
    draft: null,
    excerpt:
      "Configuration, snapshots, réplication — tout pour un storage solide.",
    content: "Article complet à venir...",
    history: [],
  },
  {
    id: "webauthn-node",
    title: "WebAuthn dans Node.js",
    date: "10 Novembre 2025",
    cat: "Dev",
    time: "10 min",
    visible: true,
    sortOrder: 2,
    docProject: "centrarr",
    draft: null,
    excerpt: "Implémentation passkeys de A à Z.",
    content: "Article complet à venir...",
    history: [],
  },
];

// ─── Docs pages (canonical from JSX prototype) ───

const defaultDocs = [
  // uni-dash docs
  {
    id: "ud-installation",
    project: "uni-dash",
    section: "Démarrage",
    title: "Installation",
    visible: true,
    draft: null,
    history: [{ date: "01 Nov 2025 14:00", summary: "Création", content: "..." }],
    content: `Assurez-vous d'avoir installé :

- **Docker** version 24+
- **Node.js** 20 LTS
- **Git**

## Installation rapide

\`\`\`bash
git clone https://github.com/Pikatsuto/unidash.git
cd unidash && ./install.sh --production
\`\`\`

## Configuration

\`\`\`env
APP_PORT=3000
DB_PATH=./data/app.db
JWT_SECRET=your-secret-here
\`\`\`

## Vérification

\`\`\`bash
curl http://localhost:3000/api/health
\`\`\``,
  },
  {
    id: "ud-configuration",
    project: "uni-dash",
    section: "Démarrage",
    title: "Configuration",
    visible: true,
    draft: null,
    history: [],
    content: "Guide de configuration détaillé à venir...",
  },
  {
    id: "ud-deploiement",
    project: "uni-dash",
    section: "Démarrage",
    title: "Déploiement",
    visible: true,
    draft: null,
    history: [],
    content: "Guide de déploiement à venir...",
  },
  {
    id: "ud-vue-ensemble",
    project: "uni-dash",
    section: "Architecture",
    title: "Vue d'ensemble",
    visible: true,
    draft: null,
    history: [],
    content: "Architecture générale de uni-dash à venir...",
  },
  {
    id: "ud-services",
    project: "uni-dash",
    section: "Architecture",
    title: "Services",
    visible: true,
    draft: null,
    history: [],
    content: "Description des services à venir...",
  },
  {
    id: "ud-base-de-donnees",
    project: "uni-dash",
    section: "Architecture",
    title: "Base de données",
    visible: true,
    draft: null,
    history: [],
    content: "Schéma de la base de données à venir...",
  },
  {
    id: "ud-authentification",
    project: "uni-dash",
    section: "API Reference",
    title: "Authentification",
    visible: true,
    draft: null,
    history: [],
    content: "Documentation de l'authentification API à venir...",
  },
  {
    id: "ud-endpoints",
    project: "uni-dash",
    section: "API Reference",
    title: "Endpoints",
    visible: true,
    draft: null,
    history: [],
    content: "Liste des endpoints API à venir...",
  },
  {
    id: "ud-webhooks",
    project: "uni-dash",
    section: "API Reference",
    title: "Webhooks",
    visible: true,
    draft: null,
    history: [],
    content: "Documentation des webhooks à venir...",
  },
  {
    id: "ud-migration",
    project: "uni-dash",
    section: "Guides avancés",
    title: "Migration",
    visible: true,
    draft: null,
    history: [],
    content: "Guide de migration à venir...",
  },
  {
    id: "ud-backup",
    project: "uni-dash",
    section: "Guides avancés",
    title: "Backup",
    visible: true,
    draft: null,
    history: [],
    content: "Guide de backup à venir...",
  },
  {
    id: "ud-monitoring",
    project: "uni-dash",
    section: "Guides avancés",
    title: "Monitoring",
    visible: true,
    draft: null,
    history: [],
    content: "Guide de monitoring à venir...",
  },
  // astral-emu docs
  {
    id: "ae-installation",
    project: "astral-emu",
    section: "Démarrage",
    title: "Installation",
    visible: true,
    draft: null,
    history: [],
    content: `## Prérequis

- Un système Linux 64-bit
- 4Go de RAM minimum
- 20Go d'espace disque

## Installation

\`\`\`bash
curl -fsSL https://astralemu.dev/install.sh | bash
\`\`\`

## Premier lancement

\`\`\`bash
astralemu --init
astralemu start
\`\`\``,
  },
  {
    id: "ae-roms",
    project: "astral-emu",
    section: "Démarrage",
    title: "Gestion des ROMs",
    visible: true,
    draft: null,
    history: [],
    content: "Guide de gestion des ROMs à venir...",
  },
  {
    id: "ae-builders",
    project: "astral-emu",
    section: "Architecture",
    title: "Builders dynamiques",
    visible: true,
    draft: null,
    history: [],
    content: "Documentation des builders dynamiques à venir...",
  },
  {
    id: "ae-themes",
    project: "astral-emu",
    section: "Personnalisation",
    title: "Thèmes EmulationStation",
    visible: true,
    draft: null,
    history: [],
    content: "Guide de personnalisation des thèmes à venir...",
  },
  // centrarr docs
  {
    id: "ct-installation",
    project: "centrarr",
    section: "Démarrage",
    title: "Installation",
    visible: true,
    draft: null,
    history: [],
    content: `## Installation rapide

\`\`\`bash
npm install -g centrarr
centrarr init
\`\`\`

## Configuration WebAuthn

La configuration des passkeys se fait dans \`config.json\`.

\`\`\`env
WEBAUTHN_RP_NAME=centrarr
WEBAUTHN_RP_ID=media.example.com
\`\`\``,
  },
  {
    id: "ct-webauthn",
    project: "centrarr",
    section: "Authentification",
    title: "WebAuthn Passkeys",
    visible: true,
    draft: null,
    history: [],
    content: "Guide complet WebAuthn à venir...",
  },
  {
    id: "ct-users",
    project: "centrarr",
    section: "Authentification",
    title: "Gestion utilisateurs",
    visible: true,
    draft: null,
    history: [],
    content: "Gestion des utilisateurs et sous-comptes à venir...",
  },
  // isol-app docs
  {
    id: "ia-installation",
    project: "isol-app",
    section: "Démarrage",
    title: "Installation",
    visible: true,
    draft: null,
    history: [],
    content: `## Prérequis

- Docker 24+
- Nginx
- Linux avec support chroot

## Installation

\`\`\`bash
git clone https://github.com/Pikatsuto/isolapp.git
cd isolapp && make install
\`\`\``,
  },
  {
    id: "ia-chroot",
    project: "isol-app",
    section: "Architecture",
    title: "Environnements chroot",
    visible: true,
    draft: null,
    history: [],
    content: "Documentation des environnements chroot isolés à venir...",
  },
  {
    id: "ia-networking",
    project: "isol-app",
    section: "Architecture",
    title: "Réseau isolé",
    visible: true,
    draft: null,
    history: [],
    content: "Documentation du networking inter-conteneurs à venir...",
  },
];

// ─── Section order per project (canonical) ───

const sectionOrders: Record<string, string[]> = {
  uni-dash: ["Démarrage", "Architecture", "API Reference", "Guides avancés"],
  astral-emu: ["Démarrage", "Architecture", "Personnalisation"],
  centrarr: ["Démarrage", "Authentification"],
  isol-app: ["Démarrage", "Architecture"],
};

// ─── Seed execution ───

console.log("Seeding database...");

// Create tables via raw SQL
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT '',
    description TEXT,
    visible INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, name)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    time TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    draft TEXT,
    visible INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    doc_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS post_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS docs (
    id TEXT PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    draft TEXT,
    visible INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS doc_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY DEFAULT 1,
    content TEXT NOT NULL,
    draft TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolio_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Clear existing data
sqlite.exec(`
  DELETE FROM post_history;
  DELETE FROM doc_history;
  DELETE FROM portfolio_history;
  DELETE FROM docs;
  DELETE FROM posts;
  DELETE FROM sections;
  DELETE FROM categories;
  DELETE FROM projects;
  DELETE FROM portfolio;
  DELETE FROM settings;
`);

// Insert portfolio
db.insert(schema.portfolio)
  .values({
    id: 1,
    content: defaultPortfolioMDX,
    draft: null,
    updatedAt: now,
  })
  .run();
console.log("  Portfolio: 1 row");

// Insert categories (deduplicate from posts)
const catNames = [...new Set(defaultPosts.map((p) => p.cat))];
for (let i = 0; i < catNames.length; i++) {
  db.insert(schema.categories)
    .values({ name: catNames[i], sortOrder: i, createdAt: now })
    .run();
}
console.log(`  Categories: ${catNames.length} rows`);

// Build category lookup
const categoryRows = db.select().from(schema.categories).all();
const catIdMap = new Map(categoryRows.map((c) => [c.name, c.id]));

// Insert projects (deduplicate from docs + posts.docProject)
const projectDisplayNames: Record<string, string> = {
  "uni-dash": "UniDash",
  "astral-emu": "AstralEmu",
  "centrarr": "Centrarr",
  "isol-app": "IsolApp",
};
const projectNames = [...new Set(defaultDocs.map((d) => d.project))];
for (let i = 0; i < projectNames.length; i++) {
  db.insert(schema.projects)
    .values({
      name: projectNames[i],
      displayName: projectDisplayNames[projectNames[i]] || projectNames[i],
      visible: true,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}
console.log(`  Projects: ${projectNames.length} rows`);

// Build project lookup
const projectRows = db.select().from(schema.projects).all();
const projIdMap = new Map(projectRows.map((p) => [p.name, p.id]));

// Insert sections with order from sectionOrders
let sectionCount = 0;
for (const [projName, sectionNames] of Object.entries(sectionOrders)) {
  const projId = projIdMap.get(projName)!;
  for (let i = 0; i < sectionNames.length; i++) {
    db.insert(schema.sections)
      .values({
        projectId: projId,
        name: sectionNames[i],
        sortOrder: i,
        createdAt: now,
      })
      .run();
    sectionCount++;
  }
}
console.log(`  Sections: ${sectionCount} rows`);

// Build section lookup: "project:section" → id
const sectionRows = db.select().from(schema.sections).all();
const sectionIdMap = new Map<string, number>();
for (const s of sectionRows) {
  const projName = projectNames.find((_, idx) => projectRows[idx].id === s.projectId)
    || projectRows.find((p) => p.id === s.projectId)!.name;
  sectionIdMap.set(`${projName}:${s.name}`, s.id);
}

// Insert posts
for (const post of defaultPosts) {
  const categoryId = catIdMap.get(post.cat)!;
  const docProjectId = post.docProject ? projIdMap.get(post.docProject) ?? null : null;

  db.insert(schema.posts)
    .values({
      id: post.id,
      title: post.title,
      date: post.date,
      categoryId,
      time: post.time,
      excerpt: post.excerpt,
      content: post.content,
      draft: post.draft,
      visible: post.visible,
      sortOrder: post.sortOrder,
      docProjectId,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  for (const h of post.history) {
    db.insert(schema.postHistory)
      .values({
        postId: post.id,
        date: h.date,
        summary: h.summary,
        content: h.content,
        createdAt: now,
      })
      .run();
  }
}
console.log(`  Posts: ${defaultPosts.length} rows`);

// Insert docs
for (let i = 0; i < defaultDocs.length; i++) {
  const doc = defaultDocs[i];
  const sectionId = sectionIdMap.get(`${doc.project}:${doc.section}`)!;

  db.insert(schema.docs)
    .values({
      id: doc.id,
      sectionId,
      title: doc.title,
      content: doc.content,
      draft: doc.draft,
      visible: doc.visible,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (doc.history) {
    for (const h of doc.history) {
      db.insert(schema.docHistory)
        .values({
          docId: doc.id,
          date: h.date,
          summary: h.summary,
          content: h.content ?? "...",
          createdAt: now,
        })
        .run();
    }
  }
}
console.log(`  Docs: ${defaultDocs.length} rows`);

// Insert settings
db.insert(schema.settings)
  .values({ key: "maintenance", value: "false" })
  .run();
console.log("  Settings: 1 row");

console.log("Seed complete!");
sqlite.close();