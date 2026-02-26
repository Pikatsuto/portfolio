import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request }) => {
  const { ids } = (await request.json()) as { ids: string[] };

  for (let i = 0; i < ids.length; i++) {
    await db.update(docs).set({ sortOrder: i }).where(eq(docs.id, ids[i]));
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
