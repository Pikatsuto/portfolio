import type { APIRoute } from "astro";
import { db } from "../../../db";
import { posts, postHistory, categories, projects } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";
import { resolveCategoryId, resolveProjectId } from "../../../lib/resolve";

export const GET: APIRoute = async ({ params, request }) => {
  const row = await db
    .select({
      id: posts.id,
      title: posts.title,
      date: posts.date,
      cat: categories.name,
      time: posts.time,
      excerpt: posts.excerpt,
      content: posts.content,
      draft: posts.draft,
      visible: posts.visible,
      sortOrder: posts.sortOrder,
      docProject: projects.name,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(projects, eq(posts.docProjectId, projects.id))
    .where(eq(posts.id, params.id!))
    .get();

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const admin = isAdmin(request);
  if (!admin && !row.visible) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const history = admin
    ? await db.select().from(postHistory).where(eq(postHistory.postId, row.id)).all()
    : [];

  return new Response(
    JSON.stringify({ ...row, draft: admin ? row.draft : null, history }),
    { headers: { "Content-Type": "application/json" } },
  );
};

export const PUT: APIRoute = async ({ params, request }) => {
  const body = (await request.json()) as Partial<{
    title: string;
    date: string;
    cat: string;
    time: string;
    excerpt: string;
    visible: boolean;
    sortOrder: number;
    docProject: string | null;
  }>;

  const existing = await db.select().from(posts).where(eq(posts.id, params.id!)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  // Resolve string fields to FK IDs
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.date !== undefined) updates.date = body.date;
  if (body.time !== undefined) updates.time = body.time;
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
  if (body.visible !== undefined) updates.visible = body.visible;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  if (body.cat !== undefined) {
    updates.categoryId = await resolveCategoryId(body.cat);
  }
  if (body.docProject !== undefined) {
    updates.docProjectId = body.docProject
      ? await resolveProjectId(body.docProject)
      : null;
  }

  await db.update(posts).set(updates).where(eq(posts.id, params.id!));

  const updated = await db
    .select({
      id: posts.id,
      title: posts.title,
      date: posts.date,
      cat: categories.name,
      time: posts.time,
      excerpt: posts.excerpt,
      content: posts.content,
      draft: posts.draft,
      visible: posts.visible,
      sortOrder: posts.sortOrder,
      docProject: projects.name,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(projects, eq(posts.docProjectId, projects.id))
    .where(eq(posts.id, params.id!))
    .get();

  return new Response(JSON.stringify(updated), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const existing = await db.select().from(posts).where(eq(posts.id, params.id!)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  // History is cascade-deleted via FK
  await db.delete(posts).where(eq(posts.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};