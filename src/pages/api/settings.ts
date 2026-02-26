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
  const body = (await request.json()) as { maintenance?: boolean };

  if (body.maintenance !== undefined) {
    await db
      .update(settings)
      .set({ value: body.maintenance ? "true" : "false" })
      .where(eq(settings.key, "maintenance"));
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
