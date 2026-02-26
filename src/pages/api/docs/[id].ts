import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs, docHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../../lib/auth";

export const GET: APIRoute = async ({ params, request }) => {
  const doc = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  if (!doc) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const admin = isAdmin(request);
  if (!admin && !doc.visible) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const history = admin
    ? await db.select().from(docHistory).where(eq(docHistory.docId, doc.id)).all()
    : [];

  return new Response(
    JSON.stringify({ ...doc, draft: admin ? doc.draft : null, history }),
    { headers: { "Content-Type": "application/json" } },
  );
};

export const PUT: APIRoute = async ({ params, request }) => {
  const body = (await request.json()) as Partial<{
    title: string;
    section: string;
    project: string;
    visible: boolean;
    sortOrder: number;
  }>;

  const existing = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  await db
    .update(docs)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(docs.id, params.id!));

  const updated = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  return new Response(JSON.stringify(updated), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const existing = await db.select().from(docs).where(eq(docs.id, params.id!)).get();
  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  await db.delete(docs).where(eq(docs.id, params.id!));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
