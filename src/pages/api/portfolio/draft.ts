import type { APIRoute } from "astro";
import { db } from "../../../db";
import { portfolio, portfolioHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ request }) => {
  const { content } = (await request.json()) as { content: string };

  const row = await db.select().from(portfolio).where(eq(portfolio.id, 1)).get();
  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const now = new Date().toISOString();
  await db.insert(portfolioHistory).values({
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
    .update(portfolio)
    .set({ draft: content, updatedAt: now })
    .where(eq(portfolio.id, 1));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
