import type { APIRoute } from "astro";
import { db } from "../../../db";
import { posts, postHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
  const admin = isAdmin(request);

  const allPosts = await db.select().from(posts).all();

  const result = await Promise.all(
    allPosts
      .filter((p) => admin || p.visible)
      .map(async (p) => {
        const history = await db
          .select()
          .from(postHistory)
          .where(eq(postHistory.postId, p.id))
          .all();
        return {
          ...p,
          draft: admin ? p.draft : null,
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
    title: string;
    date: string;
    cat: string;
    time: string;
    excerpt: string;
    content: string;
  };

  const id = body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const now = new Date().toISOString();

  // Push all existing posts down by 1, new article gets sortOrder 0
  const all = await db.select().from(posts).all();
  for (const p of all) {
    await db.update(posts).set({ sortOrder: p.sortOrder + 1 }).where(eq(posts.id, p.id));
  }

  await db.insert(posts).values({
    id,
    title: body.title,
    date: body.date,
    cat: body.cat,
    time: body.time,
    excerpt: body.excerpt,
    content: body.content,
    draft: null,
    visible: false,
    sortOrder: 0,
    docProject: null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(posts).where(eq(posts.id, id)).get();

  return new Response(JSON.stringify(created), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
