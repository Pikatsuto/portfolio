import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs, sections, projects } from "../../../db/schema";
import { like, or, eq } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const pattern = `%${q}%`;
  const results = await db
    .select({
      id: docs.id,
      project: projects.name,
      section: sections.name,
      title: docs.title,
      content: docs.content,
      visible: docs.visible,
    })
    .from(docs)
    .innerJoin(sections, eq(docs.sectionId, sections.id))
    .innerJoin(projects, eq(sections.projectId, projects.id))
    .where(
      or(
        like(docs.title, pattern),
        like(docs.content, pattern),
      ),
    )
    .all();

  // Only visible docs (unless admin, but search is public)
  const visible = results.filter((d) => d.visible);

  // Build search results with context
  const items = visible.slice(0, 15).map((d) => {
    // Find the matching line in content for preview
    const lines = d.content.split("\n");
    const lowerQ = q.toLowerCase();
    let preview = "";
    let nearestHeading = "";

    for (const line of lines) {
      if (line.startsWith("## ") || line.startsWith("### ")) {
        nearestHeading = line.replace(/^#+\s*/, "");
      }
      if (line.toLowerCase().includes(lowerQ)) {
        preview = line.replace(/^#+\s*/, "").trim();
        break;
      }
    }

    // If no content match, title matched
    if (!preview && d.title.toLowerCase().includes(lowerQ)) {
      preview = d.title;
    }

    // Truncate preview
    if (preview.length > 120) {
      preview = preview.substring(0, 120) + "\u2026";
    }

    return {
      id: d.id,
      project: d.project,
      section: d.section,
      title: d.title,
      heading: nearestHeading,
      preview,
    };
  });

  return new Response(JSON.stringify(items), {
    headers: { "Content-Type": "application/json" },
  });
};