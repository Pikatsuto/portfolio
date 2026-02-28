import type { APIRoute } from "astro";
import { db } from "../../../../db";
import { pages, pagesHistory } from "../../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { isAdmin } from "../../../../lib/auth";

export const GET: APIRoute = async ({ params, request }) => {
  const row = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, params.slug!))
    .get();

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const admin = isAdmin(request);
  const history = admin
    ? await db
        .select()
        .from(pagesHistory)
        .where(eq(pagesHistory.pageId, row.id))
        .orderBy(desc(pagesHistory.id))
        .all()
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
