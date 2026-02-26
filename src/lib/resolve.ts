import { db } from "../db";
import { categories, projects, sections } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Resolve a category name to its ID, creating it if it doesn't exist.
 */
export async function resolveCategoryId(name: string): Promise<number> {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, name))
    .get();
  if (existing) return existing.id;

  await db.insert(categories).values({
    name,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  });
  const created = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, name))
    .get();
  return created!.id;
}

/**
 * Resolve a project name to its ID, creating it if it doesn't exist.
 */
export async function resolveProjectId(name: string): Promise<number> {
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, name))
    .get();
  if (existing) return existing.id;

  const now = new Date().toISOString();
  await db.insert(projects).values({
    name,
    visible: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  });
  const created = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, name))
    .get();
  return created!.id;
}

/**
 * Resolve a section name within a project to its ID, creating it if it doesn't exist.
 */
export async function resolveSectionId(
  projectId: number,
  name: string,
): Promise<number> {
  const existing = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.projectId, projectId), eq(sections.name, name)))
    .get();
  if (existing) return existing.id;

  await db.insert(sections).values({
    projectId,
    name,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  });
  const created = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.projectId, projectId), eq(sections.name, name)))
    .get();
  return created!.id;
}