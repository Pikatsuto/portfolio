import type { APIRoute } from "astro";
import { db } from "../../../db";
import { portfolio } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async () => {
  const row = await db.select().from(portfolio).where(eq(portfolio.id, 1)).get();
  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (!row.draft) {
    return new Response(JSON.stringify({ error: "No draft to publish" }), { status: 422 });
  }

  await db
    .update(portfolio)
    .set({ content: row.draft, draft: null, updatedAt: new Date().toISOString() })
    .where(eq(portfolio.id, 1));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
