import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { pages } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ params }) => {
  const row = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, params.slug!))
    .get();

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (!row.draft) {
    return new Response(JSON.stringify({ error: "No draft to publish" }), { status: 422 });
  }

  await db
    .update(pages)
    .set({ content: row.draft, draft: null, updatedAt: new Date().toISOString() })
    .where(eq(pages.id, row.id));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
