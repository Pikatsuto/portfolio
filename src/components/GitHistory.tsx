import { useState, useRef, useEffect } from "react";
import { GitBranch } from "lucide-react";

interface HistoryEntry {
  id: number;
  date: string;
  summary: string;
  content: string;
}

interface Props {
  history: HistoryEntry[];
  restoreUrl: string; // e.g. /api/posts/{id}/draft or /api/docs/{id}/draft
}

export default function GitHistory({ history, restoreUrl }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!history || history.length === 0) {
    return (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.68rem",
          color: "var(--tertiary)",
        }}
      >
        0 commits
      </span>
    );
  }

  const restore = async (entry: HistoryEntry) => {
    const confirmFn = (window as any).__confirmModal || ((msg: string) => Promise.resolve(confirm(msg)));
    if (!(await confirmFn("Restaurer cette version ?"))) return;
    await fetch(restoreUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: entry.content }),
    });
    setOpen(false);
    window.location.reload();
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => {
          if (btnRef.current) {
            Object.assign(btnRef.current.style, {
              borderColor: "color-mix(in srgb, var(--blue) 27%, transparent)",
              color: "var(--blue-hover)",
            });
          }
        }}
        onMouseLeave={() => {
          if (btnRef.current && !open) {
            Object.assign(btnRef.current.style, {
              borderColor: "var(--line)",
              color: "var(--tertiary)",
            });
          }
        }}
        style={{
          background: "transparent",
          border: "1px solid var(--line)",
          color: "var(--tertiary)",
          padding: "0.25rem 0.6rem",
          cursor: "pointer",
          fontSize: "0.68rem",
          fontFamily: "'JetBrains Mono', monospace",
          borderRadius: "4px",
          transition: "color 0.2s, border-color 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        <GitBranch size={12} /> {history.length} commit
        {history.length > 1 ? "s" : ""}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.4rem",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "6px",
            padding: "0.6rem",
            width: 300,
            zIndex: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.7rem",
              color: "var(--tertiary)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
              fontWeight: 500,
            }}
          >
            Historique des versions
          </div>
          {history.map((h, i) => (
            <div
              key={h.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.4rem 0",
                borderBottom:
                  i < history.length - 1
                    ? "1px solid var(--line)"
                    : "none",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.7rem",
                    color: "var(--blue-hover)",
                  }}
                >
                  {h.date}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--body)",
                  }}
                >
                  {h.summary}
                </div>
              </div>
              {i > 0 && (
                <button
                  onClick={() => restore(h)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--line)",
                    color: "var(--tertiary)",
                    padding: "0.2rem 0.5rem",
                    cursor: "pointer",
                    fontSize: "0.65rem",
                    fontFamily: "'DM Sans', sans-serif",
                    borderRadius: "3px",
                    transition: "color 0.2s, border-color 0.2s",
                  }}
                >
                  Restaurer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}