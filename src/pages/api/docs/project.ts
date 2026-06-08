import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs, docHistory, sections, projects } from "../../../db/schema";
import { eq, inArray } from "drizzle-orm";

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { project } = body;

  if (!project) {
    return new Response(JSON.stringify({ error: "Project name required" }), {
      status: 400,
    });
  }

  const proj = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, project))
    .get();

  if (!proj) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
    });
  }

  // Find all section IDs for this project
  const projectSections = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.projectId, proj.id))
    .all();

  if (projectSections.length > 0) {
    const sectionIds = projectSections.map((s) => s.id);

    // Find all doc IDs in those sections
    const projectDocs = await db
      .select({ id: docs.id })
      .from(docs)
      .where(inArray(docs.sectionId, sectionIds))
      .all();

    // Delete doc_history for those docs
    if (projectDocs.length > 0) {
      const docIds = projectDocs.map((d) => d.id);
      await db.delete(docHistory).where(inArray(docHistory.docId, docIds)).run();
    }

    // Delete docs in those sections
    await db.delete(docs).where(inArray(docs.sectionId, sectionIds)).run();
  }

  // Delete sections belonging to this project
  await db.delete(sections).where(eq(sections.projectId, proj.id)).run();

  // Delete the project itself
  await db.delete(projects).where(eq(projects.id, proj.id)).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
