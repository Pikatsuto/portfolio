import type { APIRoute } from "astro";
import { db } from "../../../db";
import { docs } from "../../../db/schema";
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
    .select()
    .from(docs)
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
      preview = preview.substring(0, 120) + "…";
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
