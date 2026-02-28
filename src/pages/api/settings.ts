import type { APIRoute } from "astro";
import { db } from "../../db";
import { settings } from "../../db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
  const row = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "maintenance"))
    .get();

  return new Response(
    JSON.stringify({ maintenance: row?.value === "true" }),
    { headers: { "Content-Type": "application/json" } },
  );
};

export const PUT: APIRoute = async ({ request }) => {
  const body = (await request.json()) as Record<string, unknown>;

  // Allowed settings keys
  const allowedKeys = ["maintenance", "articlesSubtitle", "articlesDesc", "docsSubtitle", "docsDesc"];

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      const value = key === "maintenance"
        ? (body[key] ? "true" : "false")
        : String(body[key]);
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value },
        });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
