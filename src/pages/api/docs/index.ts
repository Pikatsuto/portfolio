import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs, docHistory, sections, projects } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";
import { resolveProjectId, resolveSectionId } from "../../../lib/resolve";

export const GET: APIRoute = async ({ request, url }) => {
  const admin = isAdmin(request);
  const projectName = url.searchParams.get("project");

  let query = db
    .select({
      id: docs.id,
      sectionId: docs.sectionId,
      project: projects.name,
      section: sections.name,
      title: docs.title,
      content: docs.content,
      draft: docs.draft,
      visible: docs.visible,
      sortOrder: docs.sortOrder,
      createdAt: docs.createdAt,
      updatedAt: docs.updatedAt,
    })
    .from(docs)
    .innerJoin(sections, eq(docs.sectionId, sections.id))
    .innerJoin(projects, eq(sections.projectId, projects.id));

  let allDocs;
  if (projectName) {
    allDocs = await query.where(eq(projects.name, projectName)).all();
  } else {
    allDocs = await query.all();
  }

  const result = await Promise.all(
    allDocs
      .filter((d) => admin || d.visible)
      .map(async (d) => {
        const history = admin
          ? await db.select().from(docHistory).where(eq(docHistory.docId, d.id)).all()
          : [];
        return {
          ...d,
          draft: admin ? d.draft : null,
          history: admin ? history : [],
        };
      }),
  );

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    project: string;
    section: string;
    title: string;
    content: string;
  };

  const id = `${body.project}-${body.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const projectId = await resolveProjectId(body.project);
  const sectionId = await resolveSectionId(projectId, body.section);

  // Determine sort order: max + 1 within section
  const siblings = await db
    .select()
    .from(docs)
    .where(eq(docs.sectionId, sectionId))
    .all();
  const maxSort = siblings.reduce((max, d) => Math.max(max, d.sortOrder), -1);

  const now = new Date().toISOString();

  await db.insert(docs).values({
    id,
    sectionId,
    title: body.title,
    content: body.content,
    draft: null,
    visible: false,
    sortOrder: maxSort + 1,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db
    .select({
      id: docs.id,
      project: projects.name,
      section: sections.name,
      title: docs.title,
      content: docs.content,
      draft: docs.draft,
      visible: docs.visible,
      sortOrder: docs.sortOrder,
      createdAt: docs.createdAt,
      updatedAt: docs.updatedAt,
    })
    .from(docs)
    .innerJoin(sections, eq(docs.sectionId, sections.id))
    .innerJoin(projects, eq(sections.projectId, projects.id))
    .where(eq(docs.id, id))
    .get();

  return new Response(JSON.stringify(created), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};