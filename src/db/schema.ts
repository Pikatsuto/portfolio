import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

// --- Categories (blog post categories) ---

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// --- Projects (doc projects, also referenced by posts) ---

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// --- Sections (doc sections, belong to a project) ---

export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("sections_project_name_idx").on(table.projectId, table.name),
]);

// --- Posts (blog articles) ---

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  time: text("time").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  draft: text("draft"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  docProjectId: integer("doc_project_id")
    .references(() => projects.id, { onDelete: "set null" }),
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
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
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

