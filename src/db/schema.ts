import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- Posts (blog articles) ---

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  cat: text("cat").notNull(),
  time: text("time").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  draft: text("draft"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  docProject: text("doc_project"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const postHistory = sqliteTable("post_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

// --- Docs (documentation pages) ---

export const docs = sqliteTable("docs", {
  id: text("id").primaryKey(),
  project: text("project").notNull(),
  section: text("section").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  draft: text("draft"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const docHistory = sqliteTable("doc_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  docId: text("doc_id")
    .notNull()
    .references(() => docs.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

// --- Portfolio (single row, id always 1) ---

export const portfolio = sqliteTable("portfolio", {
  id: integer("id").primaryKey().default(1),
  content: text("content").notNull(),
  draft: text("draft"),
  updatedAt: text("updated_at").notNull(),
});

export const portfolioHistory = sqliteTable("portfolio_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

// --- Settings (key/value store) ---

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// --- Constants ---

export const DOC_SECTIONS_ORDER = [
  "Démarrage",
  "Architecture",
  "API Reference",
  "Guides avancés",
  "Personnalisation",
  "Authentification",
];
