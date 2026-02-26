import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { posts } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ params }) => {
  const post = await db.select().from(posts).where(eq(posts.id, params.id!)).get();
  if (!post) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (!post.draft) {
    return new Response(JSON.stringify({ error: "No draft to publish" }), { status: 422 });
  }

  await db
    .update(posts)
    .set({ content: post.draft, draft: null, updatedAt: new Date().toISOString() })
    .where(eq(posts.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
