import { useState, useEffect, useRef } from "react";
import { Sun, Moon } from "lucide-react";

function getSystemMode(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getInitialMode(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return getSystemMode();
}

function getInitialAuto(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("theme") === null;
}

export default function ThemeToggle() {
  const [auto, setAuto] = useState(getInitialAuto);
  const [mode, setMode] = useState(getInitialMode);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Apply theme to <html> and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    if (auto) {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", mode);
    }
  }, [mode, auto]);

  // Listen to system preference changes when in auto mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      if (auto) setMode(e.matches ? "light" : "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [auto]);

  const toggle = () => {
    setAuto(false);
    setMode((m) => (m === "dark" ? "light" : "dark"));
  };

  const resetAuto = () => {
    setAuto(true);
    setMode(getSystemMode());
  };

  // "44" hex suffix = ~27% opacity, matching JSX prototype
  const borderColor = auto ? "color-mix(in srgb, var(--blue) 27%, transparent)" : "var(--line)";
  const color = auto ? "var(--blue)" : "var(--tertiary)";

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      onDoubleClick={auto ? undefined : resetAuto}
      title={
        auto
          ? `Auto (${mode})`
          : `${mode === "dark" ? "Mode clair" : "Mode sombre"} · double-clic = auto`
      }
      style={{
        background: "transparent",
        border: `1px solid ${borderColor}`,
        color,
        width: 34,
        height: 34,
        borderRadius: "50%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1rem",
        transition: "color 0.3s, border-color 0.3s",
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
            borderColor: auto ? "color-mix(in srgb, var(--blue) 27%, transparent)" : "var(--line)",
            color: auto ? "var(--blue)" : "var(--tertiary)",
          });
        }
      }}
    >
      {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
