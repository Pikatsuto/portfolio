import type { APIRoute } from "astro";
import { db } from "../../../db";
import { posts, postHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";

export const GET: APIRoute = async ({ params, request }) => {
  const post = await db.select().from(posts).where(eq(posts.id, params.id!)).get();
  if (!post) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const admin = isAdmin(request);
  if (!admin && !post.visible) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const history = admin
    ? await db.select().from(postHistory).where(eq(postHistory.postId, post.id)).all()
    : [];

  return new Response(
    JSON.stringify({ ...post, draft: admin ? post.draft : null, history }),
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
    docProject: string | null;
  }>;

  const existing = await db.select().from(posts).where(eq(posts.id, params.id!)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  await db
    .update(posts)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(posts.id, params.id!));

  const updated = await db.select().from(posts).where(eq(posts.id, params.id!)).get();
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
