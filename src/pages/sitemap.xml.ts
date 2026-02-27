import type { APIRoute } from "astro";
import { db } from "../db";
import { posts, docs, sections, projects } from "../db/schema";
import { eq } from "drizzle-orm";
import { isMaintenanceMode } from "../lib/auth";

export const GET: APIRoute = async ({ site }) => {
  // Return empty sitemap in maintenance mode
  if (isMaintenanceMode()) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`,
      { headers: { "Content-Type": "application/xml" } },
    );
  }

  const base = site?.href.replace(/\/$/, "") || "https://gabriel-guillou.fr";

  // Static pages
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "monthly" },
    { url: "/article", priority: "0.8", changefreq: "weekly" },
    { url: "/docs", priority: "0.7", changefreq: "monthly" },
  ];

  // Published articles
  const allPosts = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.visible, true))
    .all();

  // Published docs (visible projects + visible docs)
  const allDocs = await db
    .select({
      docId: docs.id,
      projectName: projects.name,
    })
    .from(docs)
    .innerJoin(sections, eq(docs.sectionId, sections.id))
    .innerJoin(projects, eq(sections.projectId, projects.id))
    .where(eq(projects.visible, true))
    .all();

  const urls = [
    ...staticPages.map(
      (p) =>
        `  <url>\n    <loc>${base}${p.url}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    ...allPosts.map(
      (p) =>
        `  <url>\n    <loc>${base}/article/${p.id}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ),
    ...allDocs.map(
      (d) =>
        `  <url>\n    <loc>${base}/docs/${d.projectName}/${d.docId}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
