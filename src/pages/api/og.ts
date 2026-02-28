import type { APIRoute } from "astro";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";

// Load font-face declarations from the static og-image.svg at startup
const ogSvgRaw = readFileSync("public/og-image.svg", "utf8");
const fontFaces = ogSvgRaw.match(/@font-face\s*\{[^}]*\}/g) || [];
const fontsCSS = fontFaces.join("\n");

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapTitle(title: string, maxChars: number): string[] {
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get("title") || "Article";
  const cat = url.searchParams.get("cat") || "";

  const titleLines = wrapTitle(title, 30);
  const titleFontSize = titleLines.length > 2 ? 56 : 72;
  const titleStartY = titleLines.length > 2 ? 230 : titleLines.length > 1 ? 250 : 290;
  const lineHeight = titleFontSize * 1.2;

  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleStartY + i * lineHeight;
      return `<text x="100" y="${y}" font-family="'Source Serif 4', serif" font-size="${titleFontSize}" font-weight="700" fill="#f0f0f4">${escapeXml(line)}</text>`;
    })
    .join("\n  ");

  const bottomY = titleStartY + titleLines.length * lineHeight + 40;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      ${fontsCSS}
    </style>
  </defs>
  <rect width="1200" height="630" fill="#0c0c12"/>
  <rect x="0" y="0" width="1200" height="4" fill="#3b82f6"/>
  ${cat ? `<text x="100" y="160" font-family="'DM Sans', sans-serif" font-size="20" font-weight="500" fill="#3b82f6" letter-spacing="5">${escapeXml(cat.toUpperCase())}</text>` : ""}
  ${titleTspans}
  <rect x="100" y="${bottomY}" width="80" height="4" fill="#3b82f6" rx="2"/>
  <text x="100" y="${bottomY + 50}" font-family="'DM Sans', sans-serif" font-size="24" fill="#a0a0b0">Gabriel Guillou</text>
  <text x="100" y="${bottomY + 85}" font-family="'DM Sans', sans-serif" font-size="20" fill="#60607a">gabriel-guillou.fr</text>
  <rect x="0" y="626" width="1200" height="4" fill="#3b82f6"/>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=604800",
    },
  });
};
