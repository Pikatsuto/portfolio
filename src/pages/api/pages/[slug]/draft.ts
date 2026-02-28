import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { pages, pagesHistory } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, request }) => {
  const { content } = (await request.json()) as { content: string };

  const row = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, params.slug!))
    .get();

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const now = new Date().toISOString();

  // Snapshot previous version before saving
  await db.insert(pagesHistory).values({
    pageId: row.id,
    date: new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    summary: "Modification",
    content: row.draft ?? row.content,
    createdAt: now,
  });

  await db
    .update(pages)
    .set({ draft: content, updatedAt: now })
    .where(eq(pages.id, row.id));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
