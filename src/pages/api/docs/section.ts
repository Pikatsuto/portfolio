import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

export const DELETE: APIRoute = async ({ request }) => {
  const { project, section } = (await request.json()) as {
    project: string;
    section: string;
  };

  if (!project || !section) {
    return new Response(JSON.stringify({ error: "project and section required" }), {
      status: 422,
    });
  }

  await db
    .delete(docs)
    .where(and(eq(docs.project, project), eq(docs.section, section)));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
