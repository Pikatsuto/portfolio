import type { APIRoute } from "astro";
import { db } from "../../../db";
import { settings } from "../../../db/schema";

export const PUT: APIRoute = async ({ request }) => {
  const { project, sections } = (await request.json()) as {
    project: string;
    sections: string[];
  };

  if (!project || !sections) {
    return new Response(JSON.stringify({ error: "Missing project or sections" }), { status: 422 });
  }

  const key = `section-order:${project}`;
  await db
    .insert(settings)
    .values({ key, value: JSON.stringify(sections) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(sections) } });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
