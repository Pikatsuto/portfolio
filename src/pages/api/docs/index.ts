import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs, docHistory } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";

export const GET: APIRoute = async ({ request, url }) => {
  const admin = isAdmin(request);
  const project = url.searchParams.get("project");

  let allDocs;
  if (project) {
    allDocs = await db
      .select()
      .from(docs)
      .where(eq(docs.project, project))
      .all();
  } else {
    allDocs = await db.select().from(docs).all();
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

  // Determine sort order: max + 1 within section
  const siblings = await db
    .select()
    .from(docs)
    .where(and(eq(docs.project, body.project), eq(docs.section, body.section)))
    .all();
  const maxSort = siblings.reduce((max, d) => Math.max(max, d.sortOrder), -1);

  const now = new Date().toISOString();

  await db.insert(docs).values({
    id,
    project: body.project,
    section: body.section,
    title: body.title,
    content: body.content,
    draft: null,
    visible: false,
    sortOrder: maxSort + 1,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(docs).where(eq(docs.id, id)).get();

  return new Response(JSON.stringify(created), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
