import yaml from "js-yaml";
import { Marked } from "marked";
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from "shiki";

// ─── MDX Frontmatter parser ───

export interface ParsedMDX {
  frontmatter: Record<string, unknown>;
  body: string;
}

export function parseMDX(mdx: string): ParsedMDX {
  const match = mdx.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: mdx };
  return {
    frontmatter: yaml.load(match[1]) as Record<string, unknown>,
    body: match[2].trim(),
  };
}

// ─── Shiki highlighter (cached singleton) ───

const SUPPORTED_LANGS = [
  "bash",
  "javascript",
  "typescript",
  "yaml",
  "json",
  "ini",
] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [...SUPPORTED_LANGS],
    });
  }
  return highlighterPromise;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9àâéèêëïîôùûüÿçœæ]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Render markdown to HTML ───

export async function renderMarkdown(md: string): Promise<string> {
  const hl = await getHighlighter();

  const marked = new Marked({
    renderer: {
      heading({ text, depth }) {
        const id = slugify(text);
        if (depth === 2) return `<h2 class="md-h2" id="${id}">${text}</h2>`;
        if (depth === 3) return `<h3 class="md-h3" id="${id}">${text}</h3>`;
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },
      code({ text, lang }) {
        // No language or unsupported → plain text with our theme color
        if (
          !lang ||
          !SUPPORTED_LANGS.includes(lang as (typeof SUPPORTED_LANGS)[number])
        ) {
          return `<div class="md-code"><pre class="md-code-plain"><code>${escapeHtml(text)}</code></pre></div>`;
        }

        // Known language → Shiki with dual themes via CSS variables
        try {
          const html = hl.codeToHtml(text, {
            lang: lang as BundledLanguage,
            themes: { dark: "github-dark", light: "github-light" },
            cssVariablePrefix: "--s-",
            defaultColor: false,
          });
          return `<div class="md-code">${html}</div>`;
        } catch {
          return `<div class="md-code"><pre class="md-code-plain"><code>${escapeHtml(text)}</code></pre></div>`;
        }
      },
      codespan({ text }) {
        return `<code class="md-inline-code">${text}</code>`;
      },
    },
  });

  return await marked.parse(md);
}

// ─── Extract TOC headings ───

export interface TOCEntry {
  text: string;
  slug: string;
}

export function extractTOC(md: string): TOCEntry[] {
  if (!md) return [];
  return md
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const text = l.slice(3);
      return { text, slug: slugify(text) };
    });
}