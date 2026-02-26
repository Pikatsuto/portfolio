import type { APIRoute } from "astro";
import { db } from "../../../db";
import { sections, projects } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

export const PUT: APIRoute = async ({ request }) => {
  const { project, sections: sectionNames } = (await request.json()) as {
    project: string;
    sections: string[];
  };

  if (!project || !sectionNames) {
    return new Response(JSON.stringify({ error: "Missing project or sections" }), { status: 422 });
  }

  const proj = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, project))
    .get();

  if (!proj) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  // Update sortOrder for each section
  for (let i = 0; i < sectionNames.length; i++) {
    await db
      .update(sections)
      .set({ sortOrder: i })
      .where(and(eq(sections.projectId, proj.id), eq(sections.name, sectionNames[i])));
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};