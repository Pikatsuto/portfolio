import { useState, useRef, useEffect } from "react";

interface SearchResult {
  id: string;
  project: string;
  section: string;
  title: string;
  heading: string;
  preview: string;
}

export default function DocSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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

  const search = (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/docs/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <span
        style={{
          position: "absolute",
          left: "0.8rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--tertiary)",
          fontSize: "0.85rem",
          pointerEvents: "none",
        }}
      >
        ⌕
      </span>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Rechercher dans la doc..."
        style={{
          width: "100%",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          color: "var(--white)",
          padding: "0.55rem 0.8rem 0.55rem 2.2rem",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
          borderRadius: "6px",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={() => {
          if (inputRef.current) inputRef.current.style.borderColor = "var(--blue)";
          if (results.length > 0) setOpen(true);
        }}
        onBlur={() => {
          if (inputRef.current) inputRef.current.style.borderColor = "var(--line)";
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "0.3rem",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "6px",
            zIndex: 50,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          {loading && (
            <div
              style={{
                padding: "0.6rem 1rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.82rem",
                color: "var(--tertiary)",
              }}
            >
              Recherche…
            </div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div
              style={{
                padding: "0.8rem 1rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.82rem",
                color: "var(--tertiary)",
              }}
            >
              Aucun résultat pour "{query}"
            </div>
          )}
          {results.map((r, i) => (
            <a
              key={`${r.id}-${r.heading}-${i}`}
              href={`/docs/${r.project}/${r.id}`}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                display: "block",
                padding: "0.6rem 1rem",
                textDecoration: "none",
                borderBottom: i < results.length - 1 ? "1px solid var(--line)" : "none",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "color-mix(in srgb, var(--blue) 6%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  alignItems: "center",
                  marginBottom: "0.15rem",
                }}
              >
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "var(--blue)", fontWeight: 500 }}>{r.project}</span>
                <span style={{ color: "var(--line)" }}>›</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "var(--tertiary)" }}>{r.title}</span>
                {r.heading && (
                  <>
                    <span style={{ color: "var(--line)" }}>›</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "var(--tertiary)" }}>{r.heading}</span>
                  </>
                )}
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.8rem",
                  color: "var(--body)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.preview}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}