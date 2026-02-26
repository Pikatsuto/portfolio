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

interface Frontmatter {
  name?: string;
  role?: string;
  headline?: string;
  bio?: string;
  skills?: Array<{ name: string; details: string }>;
  projects?: Array<{ title: string; description: string; tags?: string[]; blog?: string; docs?: string }>;
  stats?: Array<{ value: string; label: string }>;
  [key: string]: unknown;
}

interface Props {
  content: string;
  cancelUrl: string;
  saveUrl: string;
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

/* ══════════════════════════════════════════
   Syntax-highlighted textarea — line-level diff
   ══════════════════════════════════════════ */

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

/* ══════════════════════════════════════════
   Imperative preview render (no React state)
   ══════════════════════════════════════════ */

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

/* ══════════════════════════════════════════
   Toolbar item type
   ══════════════════════════════════════════ */

type TbItem = { icon: React.ReactNode; label: string; a: () => void; sep?: never } | { sep: 1; icon?: never; label?: never; a?: never };

/* ══════════════════════════════════════════
   Main PortfolioEditor component
   ══════════════════════════════════════════ */

export default function PortfolioEditor({ content, cancelUrl, saveUrl }: Props) {
  const { frontmatter: initialFM, body: initialBody } = parseMDX(content);

  const [frontmatter, setFrontmatter] = useState<Frontmatter>(initialFM);
  const [yamlTab, setYamlTab] = useState("general");
  const mdRef = useRef(initialBody);
  const previewTimer = useRef(0);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 1280;
  const [mode, setMode] = useState<"edit" | "split" | "preview">(isMobile ? "edit" : "split");
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  /* ── YAML helpers ── */

  const updateFM = (k: string, v: unknown) =>
    setFrontmatter(f => ({ ...f, [k]: v }));

  const updateArr = (k: string, i: number, field: string, v: unknown) =>
    setFrontmatter(fm => {
      const arr = [...((fm[k] as Array<Record<string, unknown>>) || [])];
      arr[i] = { ...arr[i], [field]: v };
      return { ...fm, [k]: arr };
    });

  const removeArr = (k: string, i: number) =>
    setFrontmatter(f => ({
      ...f,
      [k]: (f[k] as unknown[]).filter((_, j) => j !== i),
    }));

  const addArr = (k: string, template: Record<string, unknown>) =>
    setFrontmatter(f => ({
      ...f,
      [k]: [...((f[k] as unknown[]) || []), template],
    }));

  /* ── Preview ── */

  // Auto-switch to edit mode on small screens
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
      renderToPreview(previewRef.current, mdRef.current);
    }
  }, [mode]);

  const syncPreviewScroll = useCallback((ratio: number) => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    el.scrollTop = (el.scrollHeight - el.clientHeight) * ratio;
  }, []);

  const updatePreview = useCallback((value: string) => {
    mdRef.current = value;
    clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      if (previewRef.current) renderToPreview(previewRef.current, value);
    }, 150);
  }, []);

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

  const yamlTabs: Array<[string, string]> = [
    ["general", "Général"],
    ["skills", `Skills (${(frontmatter.skills || []).length})`],
    ["projects", `Projets (${(frontmatter.projects || []).length})`],
    ["stats", `Stats (${(frontmatter.stats || []).length})`],
  ];

  return (
    <div className="editor-root">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-header-left">
          <span className="mdx-label">MDX</span>
          <span className="mdx-title">Portfolio</span>
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

      {/* YAML tabs */}
      <div className="yaml-section">
        <div className="yaml-tabs">
          <span className="yaml-tabs-label">YAML</span>
          {yamlTabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setYamlTab(id)}
              className={`yaml-tab${yamlTab === id ? " active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="yaml-form">
          {yamlTab === "general" && (
            <div className="yaml-grid">
              <div>
                <label className="yaml-label">Nom</label>
                <input value={frontmatter.name || ""} onChange={e => updateFM("name", e.target.value)} className="yaml-input" />
              </div>
              <div>
                <label className="yaml-label">Rôle</label>
                <input value={frontmatter.role || ""} onChange={e => updateFM("role", e.target.value)} className="yaml-input" />
              </div>
              <div className="yaml-full">
                <label className="yaml-label">Headline</label>
                <input value={frontmatter.headline || ""} onChange={e => updateFM("headline", e.target.value)} className="yaml-input" />
              </div>
              <div className="yaml-full">
                <label className="yaml-label">Bio</label>
                <textarea value={frontmatter.bio || ""} onChange={e => updateFM("bio", e.target.value)} rows={2} className="yaml-input yaml-textarea" />
              </div>
            </div>
          )}

          {yamlTab === "skills" && (
            <div>
              {(frontmatter.skills || []).map((s, i) => (
                <div key={i} className="yaml-arr-row yaml-arr-row--skills">
                  <input value={s.name || ""} onChange={e => updateArr("skills", i, "name", e.target.value)} placeholder="Nom" className="yaml-input" />
                  <input value={s.details || ""} onChange={e => updateArr("skills", i, "details", e.target.value)} placeholder="Détails" className="yaml-input" />
                  <button onClick={() => removeArr("skills", i)} className="yaml-remove-btn">×</button>
                </div>
              ))}
              <button onClick={() => addArr("skills", { name: "", details: "" })} className="yaml-add-btn">+ Skill</button>
            </div>
          )}

          {yamlTab === "projects" && (
            <div>
              {(frontmatter.projects || []).map((p, i) => (
                <div key={i} className="yaml-project-card">
                  <div className="yaml-arr-row yaml-arr-row--title">
                    <input value={p.title || ""} onChange={e => updateArr("projects", i, "title", e.target.value)} className="yaml-input yaml-input--bold" placeholder="Titre" />
                    <button onClick={() => removeArr("projects", i)} className="yaml-remove-btn">×</button>
                  </div>
                  <input value={p.description || ""} onChange={e => updateArr("projects", i, "description", e.target.value)} className="yaml-input" placeholder="Description" />
                  <div className="yaml-arr-row yaml-arr-row--meta">
                    <input
                      value={Array.isArray(p.tags) ? p.tags.join(", ") : ""}
                      onChange={e => updateArr("projects", i, "tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                      placeholder="Tags (virgules)"
                      className="yaml-input"
                    />
                    <input value={p.blog || ""} onChange={e => updateArr("projects", i, "blog", e.target.value)} placeholder="Blog slug" className="yaml-input yaml-input--sm" />
                    <input value={p.docs || ""} onChange={e => updateArr("projects", i, "docs", e.target.value)} placeholder="Docs projet" className="yaml-input yaml-input--sm" />
                  </div>
                </div>
              ))}
              <button onClick={() => addArr("projects", { title: "", description: "", tags: [] })} className="yaml-add-btn">+ Projet</button>
            </div>
          )}

          {yamlTab === "stats" && (
            <div>
              {(frontmatter.stats || []).map((s, i) => (
                <div key={i} className="yaml-arr-row yaml-arr-row--stats">
                  <input value={s.value || ""} onChange={e => updateArr("stats", i, "value", e.target.value)} className="yaml-input yaml-input--value" placeholder="Valeur" />
                  <input value={s.label || ""} onChange={e => updateArr("stats", i, "label", e.target.value)} className="yaml-input" placeholder="Label" />
                  <button onClick={() => removeArr("stats", i)} className="yaml-remove-btn">×</button>
                </div>
              ))}
              <button onClick={() => addArr("stats", { value: "", label: "" })} className="yaml-add-btn">+ Stat</button>
            </div>
          )}
        </div>
      </div>

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