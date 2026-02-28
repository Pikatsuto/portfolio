import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { posts, postHistory } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { resolveProjectId } from "../../../../lib/resolve";

export const PUT: APIRoute = async ({ params, request }) => {
  const { content, title, excerpt, docProject } = (await request.json()) as {
    content: string;
    title?: string;
    excerpt?: string;
    docProject?: string | null;
  };

  const post = await db.select().from(posts).where(eq(posts.id, params.id!)).get();
  if (!post) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  // Save current content to history before modifying
  const now = new Date().toISOString();
  await db.insert(postHistory).values({
    postId: post.id,
    date: new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    summary: "Modification",
    content: post.draft ?? post.content,
    createdAt: now,
  });

  const updates: Record<string, unknown> = { draft: content, updatedAt: now };
  if (title !== undefined) updates.title = title;
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (docProject !== undefined) {
    updates.docProjectId = docProject ? await resolveProjectId(docProject) : null;
  }

  await db
    .update(posts)
    .set(updates)
    .where(eq(posts.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
