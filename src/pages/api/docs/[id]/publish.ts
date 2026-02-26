import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { docs } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ params }) => {
  const doc = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  if (!doc) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (!doc.draft) {
    return new Response(JSON.stringify({ error: "No draft to publish" }), { status: 422 });
  }

  await db
    .update(docs)
    .set({ content: doc.draft, draft: null, updatedAt: new Date().toISOString() })
    .where(eq(docs.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
