import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs, docHistory, sections, projects } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";
import { resolveProjectId, resolveSectionId } from "../../../lib/resolve";

export const GET: APIRoute = async ({ params, request }) => {
  const row = await db
    .select({
      id: docs.id,
      project: projects.name,
      section: sections.name,
      sectionId: docs.sectionId,
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
    .where(eq(docs.id, params.id!))
    .get();

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const admin = isAdmin(request);
  if (!admin && !row.visible) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const history = admin
    ? await db.select().from(docHistory).where(eq(docHistory.docId, row.id)).all()
    : [];

  return new Response(
    JSON.stringify({ ...row, draft: admin ? row.draft : null, history }),
    { headers: { "Content-Type": "application/json" } },
  );
};

export const PUT: APIRoute = async ({ params, request }) => {
  const body = (await request.json()) as Partial<{
    title: string;
    section: string;
    project: string;
    visible: boolean;
    sortOrder: number;
  }>;

  const existing = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.visible !== undefined) updates.visible = body.visible;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

  // If section or project changed, resolve the new sectionId
  if (body.section !== undefined || body.project !== undefined) {
    // Get current section info to find project
    const currentSection = await db
      .select({ projectId: sections.projectId, name: sections.name })
      .from(sections)
      .where(eq(sections.id, existing.sectionId))
      .get();

    let projectId = currentSection!.projectId;
    if (body.project !== undefined) {
      projectId = await resolveProjectId(body.project);
    }

    const sectionName = body.section ?? currentSection!.name;
    updates.sectionId = await resolveSectionId(projectId, sectionName);
  }

  await db.update(docs).set(updates).where(eq(docs.id, params.id!));

  const updated = await db
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
    .where(eq(docs.id, params.id!))
    .get();

  return new Response(JSON.stringify(updated), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const existing = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  await db.delete(docs).where(eq(docs.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};