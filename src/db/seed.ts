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

skillsDesc: "Les domaines techniques sur lesquels j'interviens au quotidien, de l'infrastructure à la livraison applicative."
skills:
  - name: Linux
    details: Debian · Ubuntu · Arch
  - name: Containers
    details: Docker · Proxmox · LXC
  - name: Dev
    details: Vue.js · React · Python · Bash
  - name: Infra
    details: Nginx · CI/CD · ZFS

projectsDesc: "Une sélection de projets personnels et professionnels, avec articles détaillés et documentation technique pour chacun."
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

statsDesc: "Quelques indicateurs qui résument mon activité et ma fiabilité en production."
stats:
  - value: 5+
    label: Années XP
  - value: 20+
    label: Projets
  - value: 99.9%
    label: Uptime
  - value: ∞
    label: Café

parcoursDesc: "Mon parcours, ma philosophie technique et mes disponibilités."
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
  "uni-dash": ["Démarrage", "Architecture", "API Reference", "Guides avancés"],
  "astral-emu": ["Démarrage", "Architecture", "Personnalisation"],
  "centrarr": ["Démarrage", "Authentification"],
  "isol-app": ["Démarrage", "Architecture"],
};

// ─── Legal pages MDX ───

const mentionsLegalesMDX = `---
owner: Gabriel Guillou
address: "[ADRESSE COMPLÈTE]"
phone: "[TÉLÉPHONE]"
email: "[EMAIL DE CONTACT]"
host: Hébergement personnel (selfhosted)
hostAddress: "[ADRESSE DU SERVEUR]"
---

## Éditeur du site

Le présent site est édité par **{{owner}}**, personne physique.

- **Adresse** : {{address}}
- **Téléphone** : {{phone}}
- **Email** : {{email}}

## Hébergement

Le site est hébergé sur un serveur personnel (selfhosted) situé en France.

- **Hébergeur** : {{owner}} (hébergement personnel)
- **Adresse du serveur** : {{hostAddress}}

## Propriété intellectuelle

Le contenu rédactionnel de ce site (textes, design, images originales) est la propriété de {{owner}}, sauf mention contraire. Toute reproduction, représentation ou diffusion de ce contenu sans autorisation expresse est interdite (articles L.335-2 et suivants du Code de la propriété intellectuelle).

Le code source de ce site est distribué sous licence **GNU General Public License v3.0** (GPL-3.0). Vous êtes libre de le copier, le modifier et le redistribuer selon les termes de cette licence, consultable dans le fichier [LICENSE](https://github.com/Pikatsuto/portfolio/blob/main/LICENSE) du dépôt. Le code source des autres projets présentés est soumis à leurs licences respectives.

## Contenus et responsabilité

Les informations publiées sur ce site sont fournies à titre indicatif et sont susceptibles d'être modifiées à tout moment. L'éditeur ne saurait être tenu responsable des erreurs, omissions, ou des résultats obtenus suite à l'utilisation de ces informations.

## Liens externes

Ce site peut contenir des liens vers des sites tiers (GitHub, LinkedIn, etc.). L'éditeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou leurs pratiques en matière de protection des données.

## Crédits

- **Conception et développement** : {{owner}}
- **Polices** : Source Serif 4, DM Sans, JetBrains Mono (licences SIL Open Font / Apache 2.0)
- **Icônes** : [Lucide](https://lucide.dev/) (licence ISC)

## Contact

Pour toute question relative au site, vous pouvez utiliser le [formulaire de contact](/contact) ou écrire à l'adresse email indiquée ci-dessus.`;

const politiqueConfidentialiteMDX = `---
responsible: Gabriel Guillou
email: "[EMAIL DE CONTACT]"
dataRetention: 12 mois après le dernier contact
lastUpdated: "${new Date().toISOString().split("T")[0]}"
---

## Responsable du traitement

Le responsable du traitement des données personnelles collectées sur ce site est :

- **Nom** : {{responsible}}
- **Email** : {{email}}
- **Adresse** : voir les [mentions légales](/mentions-legales)

## Données personnelles collectées

Les seules données personnelles collectées sur ce site proviennent du **formulaire de contact**. Les données collectées sont :

| Donnée | Obligatoire | Finalité |
|--------|:-----------:|----------|
| Nom | Oui | Identifier l'expéditeur |
| Email | Oui | Pouvoir répondre au message |
| Objet | Oui | Catégoriser la demande |
| Message | Oui | Contenu de la demande |

**Aucune autre donnée personnelle n'est collectée.** Ce site n'utilise aucun outil d'analyse, de tracking, de publicité ou de réseau social tiers.

## Finalité du traitement

Les données collectées via le formulaire de contact sont utilisées uniquement pour :

- Répondre aux demandes et messages des visiteurs
- Assurer le suivi des échanges

## Base légale

Le traitement des données est fondé sur le **consentement** de l'utilisateur (article 6.1.a du RGPD), manifesté par l'envoi volontaire du formulaire de contact.

## Destinataires des données

Les données collectées sont accessibles uniquement par {{responsible}}, éditeur du site.

Les réponses aux messages sont envoyées via **Gmail** (Google LLC). Google agit en tant que sous-traitant pour l'acheminement des emails et est soumis à sa [politique de confidentialité](https://policies.google.com/privacy). En dehors de ce service, aucune donnée n'est transmise à un tiers.

## Durée de conservation

Les messages sont conservés pendant **{{dataRetention}}** après le dernier échange. Ils peuvent être supprimés à tout moment par l'administrateur du site, ou sur demande de la personne concernée.

## Droits des utilisateurs

Conformément au RGPD (articles 15 à 21), vous disposez des droits suivants :

- **Droit d'accès** : obtenir la confirmation que des données vous concernant sont traitées et en obtenir une copie
- **Droit de rectification** : corriger des données inexactes ou incomplètes
- **Droit d'effacement** : demander la suppression de vos données
- **Droit à la portabilité** : recevoir vos données dans un format structuré et lisible
- **Droit d'opposition** : vous opposer au traitement de vos données
- **Droit de retrait du consentement** : retirer votre consentement à tout moment

Pour exercer ces droits, contactez-nous via le [formulaire de contact](/contact) ou par email à l'adresse indiquée ci-dessus.

En cas de litige, vous pouvez introduire une réclamation auprès de la **CNIL** (Commission Nationale de l'Informatique et des Libertés) : [www.cnil.fr](https://www.cnil.fr/).

## Cookies

Ce site utilise un seul cookie :

| Cookie | Type | Durée | Finalité |
|--------|------|-------|----------|
| \`session\` | Strictement nécessaire | 24 heures | Authentification de l'administrateur |

Ce cookie est de type **HttpOnly** (inaccessible au JavaScript), **SameSite=Lax** et **Secure** (transmis uniquement en HTTPS). Il ne contient aucune donnée personnelle et ne sert qu'à maintenir la session de l'administrateur du site.

**Aucun cookie de tracking, d'analyse ou publicitaire n'est utilisé.**

Conformément à la réglementation, les cookies strictement nécessaires au fonctionnement du site ne requièrent pas de consentement préalable.

### Comment supprimer les cookies

Vous pouvez à tout moment supprimer les cookies depuis les paramètres de votre navigateur :

- **Chrome** : Paramètres → Confidentialité et sécurité → Cookies
- **Firefox** : Paramètres → Vie privée et sécurité → Cookies
- **Safari** : Préférences → Confidentialité → Gérer les données
- **Edge** : Paramètres → Cookies et autorisations de site

## Sécurité

Ce site met en œuvre les mesures de sécurité suivantes :

- **HTTPS** avec certificat TLS et HSTS (HTTP Strict Transport Security)
- **Content Security Policy** (CSP) restrictive
- Protection anti-bot par **Proof-of-Work** (SHA-256) sur le formulaire de contact
- **Rate limiting** sur les soumissions de formulaire
- Aucun mot de passe utilisateur n'est collecté ou stocké

## Transfert hors Union européenne

Les données stockées sur le serveur restent en France. Toutefois, les réponses par email transitent via Gmail (Google LLC), dont les serveurs peuvent se situer hors de l'Union européenne. Google adhère au [Data Privacy Framework](https://www.dataprivacyframework.gov/) (EU-US) et propose des clauses contractuelles types conformes au RGPD.

## Hébergement

Le site est hébergé sur un serveur personnel (selfhosted) situé en France. Les données sont stockées dans une base de données SQLite locale.

## Modification de cette politique

Cette politique de confidentialité peut être mise à jour à tout moment. La date de dernière modification est indiquée ci-dessous. En cas de modification substantielle, un avis sera affiché sur le site.

**Dernière mise à jour** : {{lastUpdated}}`;

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

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    draft TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pages_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
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
  DELETE FROM pages_history;
  DELETE FROM docs;
  DELETE FROM posts;
  DELETE FROM sections;
  DELETE FROM categories;
  DELETE FROM projects;
  DELETE FROM portfolio;
  DELETE FROM pages;
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

// Insert pages
const defaultPages = [
  { slug: "mentions-legales", title: "Mentions légales", content: mentionsLegalesMDX },
  { slug: "politique-de-confidentialite", title: "Politique de confidentialité", content: politiqueConfidentialiteMDX },
];
for (const page of defaultPages) {
  db.insert(schema.pages)
    .values({
      slug: page.slug,
      title: page.title,
      content: page.content,
      draft: null,
      updatedAt: now,
    })
    .run();
}
console.log(`  Pages: ${defaultPages.length} rows`);

// Insert settings
db.insert(schema.settings)
  .values({ key: "maintenance", value: "false" })
  .run();
db.insert(schema.settings)
  .values({ key: "articlesSubtitle", value: "Notes techniques et retours d'expérience." })
  .run();
db.insert(schema.settings)
  .values({ key: "articlesDesc", value: "Retours d'expérience, analyses et guides pratiques autour du DevOps, de l'administration système et du développement web. Chaque article détaille un problème rencontré en production, une architecture mise en place ou un outil évalué sur le terrain." })
  .run();
db.insert(schema.settings)
  .values({ key: "docsSubtitle", value: "Guides techniques et références pour chaque projet." })
  .run();
db.insert(schema.settings)
  .values({ key: "docsDesc", value: "Chaque projet dispose de sa propre documentation technique : guides d'installation, architecture, configuration et références d'API. Ces documentations sont rédigées à partir de l'expérience acquise en production." })
  .run();
console.log("  Settings: 5 rows");

console.log("Seed complete!");
sqlite.close();