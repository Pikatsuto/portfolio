import type { APIRoute } from "astro";
import { db } from "../../../db";
import { portfolio, portfolioHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
  const admin = isAdmin(request);
  const row = await db.select().from(portfolio).where(eq(portfolio.id, 1)).get();

  if (!row) {
    return new Response(JSON.stringify({ content: "", draft: null, history: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const history = admin
    ? await db.select().from(portfolioHistory).all()
    : [];

  return new Response(
    JSON.stringify({
      content: row.content,
      draft: admin ? row.draft : null,
      history,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
