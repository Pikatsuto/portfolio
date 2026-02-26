import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  cat: string;
  visible: boolean;
}

interface DocResult {
  id: string;
  project: string;
  section: string;
  title: string;
  heading: string;
  preview: string;
}

interface Props {
  posts: Post[];
}

export default function GlobalSearch({ posts }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docResults, setDocResults] = useState<DocResult[]>([]);
  const [docLoading, setDocLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keyboard shortcut: Ctrl+K / Cmd+K to open, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Auto-focus the input when modal opens, reset when it closes
  useEffect(() => {
    if (open) {
      // Small delay to allow the modal to render
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
      };
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setDocResults([]);
      setDocLoading(false);
    }
  }, [open]);

  // Debounced doc search
  useEffect(() => {
    if (query.trim().length < 2) {
      setDocResults([]);
      setDocLoading(false);
      return;
    }

    setDocLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/docs/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setDocResults(data);
        }
      } finally {
        setDocLoading(false);
      }
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Client-side blog filtering
  const q = query.toLowerCase();
  const blogResults =
    q.length >= 2
      ? posts
          .filter((p) => p.visible)
          .filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.excerpt.toLowerCase().includes(q) ||
              p.cat.toLowerCase().includes(q),
          )
      : [];

  const hasResults = blogResults.length > 0 || docResults.length > 0;
  const hasQuery = query.trim().length >= 2;

  const navigate = (url: string) => {
    setOpen(false);
    window.location.href = url;
  };

  return (
    <>
      {/* Trigger button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(true)}
        title="Rechercher (Ctrl+K)"
        style={{
          background: "transparent",
          border: "1px solid var(--line)",
          color: "var(--tertiary)",
          width: 34,
          height: 34,
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.3s, border-color 0.3s",
          padding: 0,
        }}
        onMouseEnter={() => {
          if (btnRef.current) {
            Object.assign(btnRef.current.style, {
              borderColor: "var(--blue)",
              color: "var(--blue-hover)",
            });
          }
        }}
        onMouseLeave={() => {
          if (btnRef.current) {
            Object.assign(btnRef.current.style, {
              borderColor: "var(--line)",
              color: "var(--tertiary)",
            });
          }
        }}
      >
        <Search size={15} />
      </button>

      {/* Modal overlay — rendered via portal to escape nav stacking context */}
      {open && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(12, 12, 18, 0.7)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "min(20vh, 160px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Modal box */}
          <div
            style={{
              maxWidth: 560,
              width: "90%",
              maxHeight: "70vh",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Search input row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 1rem",
                borderBottom: "1px solid var(--line)",
                gap: "0.6rem",
                flexShrink: 0,
              }}
            >
              <Search
                size={16}
                style={{
                  color: "var(--tertiary)",
                  flexShrink: 0,
                }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher articles et documentation..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--white)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.95rem",
                  padding: "0.85rem 0",
                }}
              />
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--line)",
                  color: "var(--tertiary)",
                  borderRadius: 4,
                  cursor: "pointer",
                  padding: "2px 6px",
                  fontSize: "0.65rem",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                ESC
              </button>
            </div>

            {/* Results area */}
            <div
              style={{
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* Loading state */}
              {docLoading && hasQuery && (
                <div
                  style={{
                    padding: "0.8rem 1rem",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.82rem",
                    color: "var(--tertiary)",
                  }}
                >
                  Recherche...
                </div>
              )}

              {/* No results */}
              {!docLoading && hasQuery && !hasResults && (
                <div
                  style={{
                    padding: "1.5rem 1rem",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.85rem",
                    color: "var(--tertiary)",
                    textAlign: "center",
                  }}
                >
                  Aucun resultat pour "{query}"
                </div>
              )}

              {/* Empty state (no query) */}
              {!hasQuery && (
                <div
                  style={{
                    padding: "1.5rem 1rem",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.85rem",
                    color: "var(--tertiary)",
                    textAlign: "center",
                  }}
                >
                  Tapez au moins 2 caracteres...
                </div>
              )}

              {/* Blog articles section */}
              {blogResults.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: "0.5rem 1rem 0.3rem",
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--tertiary)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                    }}
                  >
                    Articles
                  </div>
                  {blogResults.map((post) => (
                    <ResultRow
                      key={post.id}
                      title={post.title}
                      preview={post.excerpt}
                      meta={post.cat}
                      onClick={() => navigate(`/blog/${post.id}`)}
                    />
                  ))}
                </div>
              )}

              {/* Documentation section */}
              {docResults.length > 0 && (
                <div>
                  {blogResults.length > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: "var(--line)",
                        margin: "0.2rem 0",
                      }}
                    />
                  )}
                  <div
                    style={{
                      padding: "0.5rem 1rem 0.3rem",
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--tertiary)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                    }}
                  >
                    Documentation
                  </div>
                  {docResults.map((doc, i) => (
                    <ResultRow
                      key={`${doc.id}-${doc.heading}-${i}`}
                      title={doc.title}
                      preview={doc.preview}
                      meta={
                        doc.heading
                          ? `${doc.project} > ${doc.heading}`
                          : doc.project
                      }
                      onClick={() =>
                        navigate(`/docs/${doc.project}/${doc.id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ─── Individual result row ─── */

interface ResultRowProps {
  title: string;
  preview: string;
  meta: string;
  onClick: () => void;
}

function ResultRow({ title, preview, meta, onClick }: ResultRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={rowRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
      style={{
        padding: "0.55rem 1rem",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={() => {
        if (rowRef.current) {
          rowRef.current.style.background =
            "color-mix(in srgb, var(--blue) 6%, transparent)";
        }
      }}
      onMouseLeave={() => {
        if (rowRef.current) {
          rowRef.current.style.background = "transparent";
        }
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.1rem",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.88rem",
            fontWeight: 500,
            color: "var(--white)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.68rem",
            color: "var(--blue)",
            flexShrink: 0,
          }}
        >
          {meta}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
          color: "var(--body)",
          whiteSpace: "nowrap" as const,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {preview}
      </div>
    </div>
  );
}
