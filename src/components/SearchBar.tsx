import { useState, useRef } from "react";

interface Props {
  posts: Array<{
    id: string;
    title: string;
    excerpt: string;
    cat: string;
    visible: boolean;
  }>;
}

export default function SearchBar({ posts }: Props) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const q = search.toLowerCase();
  const visiblePosts = posts.filter((p) => p.visible);
  const hidden = q
    ? visiblePosts
        .filter(
          (p) =>
            !p.title.toLowerCase().includes(q) &&
            !p.excerpt.toLowerCase().includes(q) &&
            !p.cat.toLowerCase().includes(q),
        )
        .map((p) => p.id)
    : [];

  // Communicate filtered IDs to the page via a data attribute on body
  if (typeof document !== "undefined") {
    document.body.setAttribute("data-hidden-posts", JSON.stringify(hidden));
    document.querySelectorAll<HTMLElement>("[data-post-id]").forEach((el) => {
      const id = el.getAttribute("data-post-id");
      el.style.display = id && hidden.includes(id) ? "none" : "";
    });
    // Show/hide "no results" message
    const noResults = document.getElementById("no-results");
    if (noResults) {
      noResults.style.display =
        q && hidden.length === visiblePosts.length ? "" : "none";
    }
  }

  return (
    <div style={{ position: "relative", width: 260 }}>
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
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un article..."
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
        }}
        onFocus={() => {
          if (inputRef.current)
            inputRef.current.style.borderColor = "var(--blue)";
        }}
        onBlur={() => {
          if (inputRef.current)
            inputRef.current.style.borderColor = "var(--line)";
        }}
      />
    </div>
  );
}