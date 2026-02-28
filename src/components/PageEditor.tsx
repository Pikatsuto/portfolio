import { useState, useRef, useCallback, useEffect, memo } from "react";
import yaml from "js-yaml";
import "../styles/editor.css";
import "../styles/portfolio-editor.css";
import { Marked } from "marked";
import mermaid from "mermaid";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Code, CodeXml, GitBranch,
  Link, Image, Minus, Quote,
  Table, Superscript, Subscript,
} from "lucide-react";

/* ─── Types ─── */

type Frontmatter = Record<string, unknown>;

interface Props {
  content: string;
  cancelUrl: string;
  saveUrl: string;
  pageTitle?: string;
}

/* ─── MDX parsing / serialization ─── */

function parseMDX(mdx: string): { frontmatter: Frontmatter; body: string } {
  const match = mdx.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: mdx };
  return {
    frontmatter: (yaml.load(match[1]) as Frontmatter) || {},
    body: match[2].trim(),
  };
}

function serializeMDX(frontmatter: Frontmatter, body: string): string {
  return `---\n${yaml.dump(frontmatter, { lineWidth: -1, noRefs: true })}---\n\n${body}`;
}

/** Replace {{key}} placeholders with frontmatter values */
function interpolate(body: string, fm: Frontmatter): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = fm[key];
    return typeof val === "string" ? val : `{{${key}}}`;
  });
}

/* ─── Marked + Mermaid setup (client-only) ─── */

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    heading({ text, depth }) {
      const id = text.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^a-z0-9àâéèêëïîôùûüÿçœæ]+/g, "-").replace(/(^-|-$)/g, "");
      if (depth === 2) return `<h2 class="md-h2" id="${id}">${text}</h2>`;
      if (depth === 3) return `<h3 class="md-h3" id="${id}">${text}</h3>`;
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },
    code({ text, lang }) {
      if (lang === "mermaid") {
        return `<pre><code class="language-mermaid">${text}</code></pre>`;
      }
      const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<div class="md-code"><pre class="md-code-plain"><code>${escaped}</code></pre></div>`;
    },
    codespan({ text }) {
      return `<code class="md-inline-code">${text}</code>`;
    },
  },
});

mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: "dark",
  themeVariables: {
    primaryColor: "#3b82f6",
    primaryTextColor: "#e8e8ec",
    primaryBorderColor: "#1e1e26",
    lineColor: "#888890",
    secondaryColor: "#121218",
    tertiaryColor: "#16161e",
  },
});

/* ── Syntax-highlighted textarea ── */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlightLine(line: string, inCode: boolean): string {
  const el = esc(line);
  if (line.startsWith("```")) return `<span style="color:var(--tertiary)">${el}</span>`;
  if (inCode) return `<span style="color:var(--syn-green)">${el}</span>`;
  if (line.startsWith("# ")) return `<span style="color:var(--tertiary)"># </span><span style="color:var(--white);font-weight:600">${esc(line.slice(2))}</span>`;
  if (line.startsWith("## ")) return `<span style="color:var(--tertiary)">## </span><span style="color:var(--white)">${esc(line.slice(3))}</span>`;
  if (line.startsWith("### ")) return `<span style="color:var(--tertiary)">### </span><span style="color:var(--white)">${esc(line.slice(4))}</span>`;
  if (line.startsWith("#### ")) return `<span style="color:var(--tertiary)">#### </span><span style="color:var(--white)">${esc(line.slice(5))}</span>`;
  if (line.startsWith("- ") || line.startsWith("* ")) return `<span style="color:var(--syn-pink)">${esc(line.slice(0, 2))}</span><span style="color:var(--body)">${esc(line.slice(2))}</span>`;
  const numMatch = line.match(/^(\d+\.\s)(.*)/);
  if (numMatch) return `<span style="color:var(--syn-pink)">${esc(numMatch[1])}</span><span style="color:var(--body)">${esc(numMatch[2])}</span>`;
  if (line.startsWith("> ")) return `<span style="color:var(--blue)">&gt; </span><span style="color:var(--secondary)">${esc(line.slice(2))}</span>`;
  if (line.startsWith("---") || line.startsWith("***")) return `<span style="color:var(--tertiary)">${el}</span>`;
  if (line.startsWith("- [x] ") || line.startsWith("- [ ] ")) return `<span style="color:var(--syn-pink)">${esc(line.slice(0, 6))}</span><span style="color:var(--body)">${esc(line.slice(6))}</span>`;
  if (line.startsWith("|")) return `<span style="color:var(--secondary)">${el}</span>`;
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\))/);
  return parts.map((p) => {
    const pe = esc(p);
    if (p.startsWith("**")) return `<span style="color:var(--syn-yellow)">${pe}</span>`;
    if (p.startsWith("~~")) return `<span style="color:var(--tertiary);text-decoration:line-through">${pe}</span>`;
    if (p.startsWith("*") && p.endsWith("*")) return `<span style="color:var(--syn-purple)">${pe}</span>`;
    if (p.startsWith("`")) return `<span style="color:var(--syn-green)">${pe}</span>`;
    if (p.startsWith("![") || p.startsWith("[")) return `<span style="color:var(--blue)">${pe}</span>`;
    return `<span style="color:var(--body)">${pe}</span>`;
  }).join("");
}

function highlightLines(text: string): { htmls: string[] } {
  const lines = text.split("\n");
  let inCode = false;
  const htmls: string[] = [];
  for (const line of lines) {
    htmls.push(highlightLine(line, inCode));
    if (line.startsWith("```")) inCode = !inCode;
  }
  return { htmls };
}

const HighlightedTextarea = memo(function HighlightedTextarea({ defaultValue, onInput, style, onScroll }: {
  defaultValue: string;
  onInput: (value: string) => void;
  style?: React.CSSProperties;
  onScroll?: (ratio: number) => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const prevRef = useRef<string[]>([]);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    const { htmls } = highlightLines(defaultValue);
    const frag = document.createDocumentFragment();
    for (const h of htmls) {
      const div = document.createElement("div");
      div.innerHTML = h || "\u200b";
      frag.appendChild(div);
    }
    pre.appendChild(frag);
    prevRef.current = htmls;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = () => {
    const ta = taRef.current;
    const pre = preRef.current;
    if (!ta || !pre) return;

    const { htmls } = highlightLines(ta.value);
    const prev = prevRef.current;
    const children = pre.children;

    const common = Math.min(htmls.length, prev.length);
    for (let i = 0; i < common; i++) {
      if (htmls[i] !== prev[i]) {
        (children[i] as HTMLElement).innerHTML = htmls[i] || "\u200b";
      }
    }

    if (htmls.length > prev.length) {
      const frag = document.createDocumentFragment();
      for (let i = prev.length; i < htmls.length; i++) {
        const div = document.createElement("div");
        div.innerHTML = htmls[i] || "\u200b";
        frag.appendChild(div);
      }
      pre.appendChild(frag);
    }

    while (pre.children.length > htmls.length) {
      pre.removeChild(pre.lastChild!);
    }

    prevRef.current = htmls;
    onInput(ta.value);
  };

  const syncScroll = () => {
    if (taRef.current && preRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
      if (onScroll) {
        const ta = taRef.current;
        const maxScroll = ta.scrollHeight - ta.clientHeight;
        onScroll(maxScroll > 0 ? ta.scrollTop / maxScroll : 0);
      }
    }
  };

  const sharedStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.88rem",
    lineHeight: "1.8",
    padding: "1.5rem",
    margin: 0,
    border: "none",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    letterSpacing: "0px",
    fontWeight: 400,
    tabSize: 2,
    textRendering: "auto",
  };

  return (
    <div style={{ position: "relative", ...style, overflow: "hidden" }}>
      <pre ref={preRef} aria-hidden="true" style={{
        ...sharedStyle,
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--bg)", color: "var(--body)", pointerEvents: "none",
        overflowY: "auto", zIndex: 1,
      }} />
      <textarea ref={taRef} defaultValue={defaultValue} onInput={handleInput} onScroll={syncScroll} spellCheck={false} style={{
        ...sharedStyle,
        position: "relative", width: "100%", height: "100%",
        background: "transparent", color: "transparent", caretColor: "var(--blue-hover)",
        resize: "none", outline: "none", zIndex: 2, overflowY: "auto",
      }} />
    </div>
  );
});

/* ── Preview renderer ── */

async function renderToPreview(el: HTMLDivElement, markdown: string) {
  const html = await marked.parse(markdown);

  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const newChildren = Array.from(tmp.childNodes);
  const oldChildren = Array.from(el.childNodes);

  const common = Math.min(newChildren.length, oldChildren.length);
  for (let i = 0; i < common; i++) {
    const o = oldChildren[i];
    const n = newChildren[i];
    if (o instanceof HTMLElement && o.getAttribute("data-mermaid-rendered")) continue;
    if (!o.isEqualNode(n)) {
      el.replaceChild(n, o);
    }
  }

  for (let i = common; i < newChildren.length; i++) {
    el.appendChild(newChildren[i]);
  }

  while (el.childNodes.length > newChildren.length) {
    el.removeChild(el.lastChild!);
  }

  const mermaidBlocks = el.querySelectorAll<HTMLElement>("code.language-mermaid");
  for (let i = 0; i < mermaidBlocks.length; i++) {
    const block = mermaidBlocks[i];
    const container = block.parentElement;
    if (!container || container.getAttribute("data-mermaid-rendered")) continue;
    const text = block.textContent || "";
    if (!text.trim()) continue;
    container.setAttribute("data-mermaid-rendered", "true");
    const id = `mermaid-pe-${Date.now()}-${i}`;
    try {
      const { svg } = await mermaid.render(id, text);
      container.innerHTML = svg;
      container.style.background = "transparent";
      container.style.border = "none";
      container.style.textAlign = "center";
      container.style.padding = "1rem 0";
    } catch {
      document.getElementById(id)?.remove();
      document.getElementById("d" + id)?.remove();
    }
  }
}

/* ── Toolbar item type ── */

type TbItem = { icon: React.ReactNode; label: string; a: () => void; sep?: never } | { sep: 1; icon?: never; label?: never; a?: never };

/* ══════════════════════════════════════════
   Main PageEditor component
   ══════════════════════════════════════════ */

export default function PageEditor({ content, cancelUrl, saveUrl, pageTitle }: Props) {
  const { frontmatter: initialFM, body: initialBody } = parseMDX(content);

  const [frontmatter, setFrontmatter] = useState<Frontmatter>(initialFM);
  const mdRef = useRef(initialBody);
  const previewTimer = useRef(0);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 1280;
  const [mode, setMode] = useState<"edit" | "split" | "preview">(isMobile ? "edit" : "split");
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  /* ── YAML helpers ── */

  const updateFM = (k: string, v: unknown) =>
    setFrontmatter(f => ({ ...f, [k]: v }));

  // Get all string-valued frontmatter keys for the form
  const stringFields = Object.entries(frontmatter).filter(
    ([, v]) => typeof v === "string"
  ) as [string, string][];

  /* ── Preview ── */

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1280px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMode((m) => m === "split" ? "edit" : m);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (mode !== "edit" && previewRef.current) {
      renderToPreview(previewRef.current, interpolate(mdRef.current, frontmatter));
    }
  }, [mode, frontmatter]);

  const syncPreviewScroll = useCallback((ratio: number) => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    el.scrollTop = (el.scrollHeight - el.clientHeight) * ratio;
  }, []);

  const updatePreview = useCallback((value: string) => {
    mdRef.current = value;
    clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      if (previewRef.current) renderToPreview(previewRef.current, interpolate(value, frontmatter));
    }, 150);
  }, [frontmatter]);

  /* ── Toolbar ── */

  const insert = useCallback((before: string, after = "") => {
    const ta = document.querySelector<HTMLTextAreaElement>(".mdx-editor-area textarea");
    if (!ta) return;
    ta.focus();
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.slice(s, e) || "texte";
    document.execCommand("insertText", false, before + sel + after);
    updatePreview(ta.value);
    const selStart = s + before.length;
    ta.setSelectionRange(selStart, selStart + sel.length);
  }, [updatePreview]);

  const sz = 15;
  const tb: TbItem[] = [
    { icon: <Bold size={sz} />, label: "Gras", a: () => insert("**", "**") },
    { icon: <Italic size={sz} />, label: "Italique", a: () => insert("*", "*") },
    { icon: <Underline size={sz} />, label: "Souligné", a: () => insert("<u>", "</u>") },
    { icon: <Strikethrough size={sz} />, label: "Barré", a: () => insert("~~", "~~") },
    { icon: <Superscript size={sz} />, label: "Exposant", a: () => insert("<sup>", "</sup>") },
    { icon: <Subscript size={sz} />, label: "Indice", a: () => insert("<sub>", "</sub>") },
    { sep: 1 },
    { icon: <Heading1 size={sz} />, label: "Titre 1", a: () => insert("\n## ", "\n") },
    { icon: <Heading2 size={sz} />, label: "Titre 2", a: () => insert("\n### ", "\n") },
    { icon: <Heading3 size={sz} />, label: "Titre 3", a: () => insert("\n#### ", "\n") },
    { sep: 1 },
    { icon: <List size={sz} />, label: "Liste", a: () => insert("\n- ", "\n") },
    { icon: <ListOrdered size={sz} />, label: "Liste numérotée", a: () => insert("\n1. ", "\n") },
    { icon: <ListChecks size={sz} />, label: "Checkbox", a: () => insert("\n- [ ] ", "\n") },
    { sep: 1 },
    { icon: <Code size={sz} />, label: "Code inline", a: () => insert("`", "`") },
    { icon: <CodeXml size={sz} />, label: "Bloc de code", a: () => insert("\n```bash\n", "\n```\n") },
    { icon: <GitBranch size={sz} />, label: "Mermaid", a: () => insert("\n```mermaid\ngraph TD\n  A --> B\n", "\n```\n") },
    { sep: 1 },
    { icon: <Link size={sz} />, label: "Lien", a: () => insert("[", "](url)") },
    { icon: <Image size={sz} />, label: "Image", a: () => insert("![alt](", ")") },
    { icon: <Minus size={sz} />, label: "Séparateur", a: () => insert("\n---\n", "") },
    { icon: <Quote size={sz} />, label: "Citation", a: () => insert("\n> ", "\n") },
    { sep: 1 },
    { icon: <Table size={sz} />, label: "Tableau", a: () => insert("\n| Col1 | Col2 |\n| --- | --- |\n| ", " | |\n") },
  ];

  /* ── Save ── */

  const handleSave = async () => {
    setSaving(true);
    try {
      const mdxContent = serializeMDX(frontmatter, mdRef.current);
      const res = await fetch(saveUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: mdxContent }),
      });
      if (res.ok) window.location.href = cancelUrl;
    } finally {
      setSaving(false);
    }
  };

  const modes: Array<{ key: "edit" | "split" | "preview"; label: string }> = [
    { key: "edit", label: "Édition" },
    { key: "split", label: "Split" },
    { key: "preview", label: "Aperçu" },
  ];

  return (
    <div className="editor-root">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-header-left">
          <span className="mdx-label">MDX</span>
          <span className="mdx-title">{pageTitle || "Page"}</span>
        </div>
        <div className="editor-header-modes">
          {modes.map((m) => (
            <button key={m.key} onClick={() => setMode(m.key)} className={`editor-mode-btn${mode === m.key ? " active" : ""}${m.key === "split" ? " editor-mode-split" : ""}`}>{m.label}</button>
          ))}
        </div>
        <div className="editor-header-actions">
          <button onClick={() => { window.location.href = cancelUrl; }} className="editor-cancel-btn">Annuler</button>
          <button onClick={handleSave} disabled={saving} className={`editor-save-btn${saving ? " saving" : ""}`}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* YAML fields */}
      {stringFields.length > 0 && (
        <div className="yaml-section">
          <div className="yaml-tabs">
            <span className="yaml-tabs-label">YAML</span>
          </div>
          <div className="yaml-form">
            <div className="yaml-grid">
              {stringFields.map(([key, val]) => (
                <div key={key} className={val.length > 50 ? "yaml-full" : ""}>
                  <label className="yaml-label">{key}</label>
                  <input
                    value={val}
                    onChange={e => updateFM(key, e.target.value)}
                    className="yaml-input"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="editor-toolbar">
        {tb.map((item, i) =>
          item.sep ? (
            <div key={i} className="editor-toolbar-sep" />
          ) : (
            <button
              key={i}
              onClick={item.a}
              title={item.label}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "color-mix(in srgb, var(--blue) 10%, transparent)";
                e.currentTarget.style.color = "var(--blue-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--tertiary)";
              }}
              className="editor-toolbar-btn"
            >
              {item.icon}
            </button>
          )
        )}
      </div>

      {/* Editor area */}
      <div className={`editor-area mdx-editor-area editor-area--${mode}`}>
        {mode !== "preview" && (
          <HighlightedTextarea
            defaultValue={initialBody}
            onInput={updatePreview}
            onScroll={mode === "split" ? syncPreviewScroll : undefined}
            style={{ borderRight: mode === "split" ? "1px solid var(--line)" : "none" }}
          />
        )}
        {mode !== "edit" && (
          <div ref={previewRef} className={`md-body editor-preview${mode === "preview" ? " editor-preview--full" : ""}`} />
        )}
      </div>
    </div>
  );
}
