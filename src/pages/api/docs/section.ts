import type { APIRoute } from "astro";
import { db } from "../../../db";
import { sections, projects } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

export const DELETE: APIRoute = async ({ request }) => {
  const { project, section } = (await request.json()) as {
    project: string;
    section: string;
  };

  if (!project || !section) {
    return new Response(JSON.stringify({ error: "project and section required" }), {
      status: 422,
    });
  }

  const proj = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, project))
    .get();

  if (!proj) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  // Deleting the section cascades to all its docs
  await db
    .delete(sections)
    .where(and(eq(sections.projectId, proj.id), eq(sections.name, section)));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};