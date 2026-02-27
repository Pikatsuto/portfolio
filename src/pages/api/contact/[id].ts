import type { APIRoute } from "astro";
import { db } from "../../../db";
import { messages } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  const existing = await db.select().from(messages).where(eq(messages.id, id)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as { read?: boolean };
  await db
    .update(messages)
    .set({ read: body.read ?? true })
    .where(eq(messages.id, id));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  const existing = await db.select().from(messages).where(eq(messages.id, id)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db.delete(messages).where(eq(messages.id, id));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
