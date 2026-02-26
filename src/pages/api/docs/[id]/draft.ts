import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { docs, docHistory } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, request }) => {
  const { content } = (await request.json()) as { content: string };

  const doc = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  if (!doc) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const now = new Date().toISOString();
  await db.insert(docHistory).values({
    docId: doc.id,
    date: new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    summary: "Modification",
    content: doc.draft ?? doc.content,
    createdAt: now,
  });

  await db
    .update(docs)
    .set({ draft: content, updatedAt: now })
    .where(eq(docs.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
