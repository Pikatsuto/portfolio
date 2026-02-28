import { useState, useEffect, useRef, useCallback } from "react";
import { Settings, Sun, Moon, Minus, Plus } from "lucide-react";

/* ── Theme helpers ── */

function getSystemMode(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
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

/* ── Font scale helpers ── */

const SCALES = [80, 90, 100, 110, 120];
const DEFAULT_IDX = 2; // 100%

function getInitialScale(): number {
  if (typeof window === "undefined") return DEFAULT_IDX;
  const stored = localStorage.getItem("fontScale");
  if (stored) {
    const idx = SCALES.indexOf(Number(stored));
    if (idx !== -1) return idx;
  }
  return DEFAULT_IDX;
}

/* ══════════════════════════════════════════
   SettingsDropdown component
   ══════════════════════════════════════════ */

export default function SettingsDropdown() {
  /* ── Theme state ── */
  const [auto, setAuto] = useState(getInitialAuto);
  const [mode, setMode] = useState(getInitialMode);

  /* ── Font scale state ── */
  const [scaleIdx, setScaleIdx] = useState(getInitialScale);

  /* ── Dropdown state ── */
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  /* ── Theme effects ── */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    if (auto) {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", mode);
    }
  }, [mode, auto]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      if (auto) setMode(e.matches ? "light" : "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [auto]);

  /* ── Font scale effect ── */
  useEffect(() => {
    const scale = SCALES[scaleIdx];
    document.documentElement.style.fontSize = scale + "%";
    if (scale === 100) {
      localStorage.removeItem("fontScale");
    } else {
      localStorage.setItem("fontScale", String(scale));
    }
  }, [scaleIdx]);

  /* ── Close on outside click / Escape ── */
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  /* ── Theme toggle ── */
  const toggleTheme = useCallback(() => {
    setAuto(false);
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const resetAuto = useCallback(() => {
    setAuto(true);
    setMode(getSystemMode());
  }, []);

  /* ── Styles ── */
  const borderColor = open ? "var(--blue)" : "var(--line)";
  const iconColor = open ? "var(--blue-hover)" : "var(--tertiary)";

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Réglages"
        title="Réglages"
        style={{
          background: "transparent",
          border: `1px solid ${borderColor}`,
          color: iconColor,
          width: 34,
          height: 34,
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          if (btnRef.current && !open) {
            Object.assign(btnRef.current.style, {
              borderColor: "var(--line)",
              color: "var(--tertiary)",
            });
          }
        }}
      >
        <Settings size={16} />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "0.8rem",
          minWidth: "200px",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          gap: "0.7rem",
        }}>
          {/* ── Theme row ── */}
          <div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "var(--fs-xs)",
              color: "var(--tertiary)",
              marginBottom: "0.4rem",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>Thème</div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <ThemeBtn
                active={!auto && mode === "light"}
                onClick={() => { setAuto(false); setMode("light"); }}
                icon={<Sun size={14} />}
                label="Clair"
              />
              <ThemeBtn
                active={!auto && mode === "dark"}
                onClick={() => { setAuto(false); setMode("dark"); }}
                icon={<Moon size={14} />}
                label="Sombre"
              />
              <ThemeBtn
                active={auto}
                onClick={resetAuto}
                icon={null}
                label="Auto"
              />
            </div>
          </div>

          {/* ── Separator ── */}
          <div style={{ borderTop: "1px solid var(--line)" }} />

          {/* ── Font size row ── */}
          <div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "var(--fs-xs)",
              color: "var(--tertiary)",
              marginBottom: "0.4rem",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>Taille du texte</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ScaleBtn disabled={scaleIdx <= 0} onClick={() => setScaleIdx((i) => Math.max(0, i - 1))} icon={<Minus size={14} />} label="Réduire" />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "var(--fs-sm)",
                color: "var(--white)",
                minWidth: "3rem",
                textAlign: "center",
                fontWeight: scaleIdx !== DEFAULT_IDX ? 600 : 400,
              }}>{SCALES[scaleIdx]}%</span>
              <ScaleBtn disabled={scaleIdx >= SCALES.length - 1} onClick={() => setScaleIdx((i) => Math.min(SCALES.length - 1, i + 1))} icon={<Plus size={14} />} label="Agrandir" />
              {scaleIdx !== DEFAULT_IDX && (
                <button
                  onClick={() => setScaleIdx(DEFAULT_IDX)}
                  title="Réinitialiser"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--tertiary)",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "var(--fs-xs)",
                    padding: "0.2rem 0.4rem",
                    transition: "color 0.2s",
                  }}
                >Reset</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small sub-components ── */

function ThemeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3rem",
        padding: "0.35rem 0.5rem",
        borderRadius: "6px",
        border: active ? "1px solid var(--blue)" : "1px solid var(--line)",
        background: active ? "color-mix(in srgb, var(--blue) 10%, transparent)" : "transparent",
        color: active ? "var(--blue)" : "var(--tertiary)",
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "var(--fs-xs)",
        transition: "color 0.2s, border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={() => {
        if (ref.current && !active) {
          Object.assign(ref.current.style, {
            borderColor: "var(--blue)",
            color: "var(--blue-hover)",
          });
        }
      }}
      onMouseLeave={() => {
        if (ref.current && !active) {
          Object.assign(ref.current.style, {
            borderColor: "var(--line)",
            color: "var(--tertiary)",
          });
        }
      }}
    >
      {icon}{label}
    </button>
  );
}

function ScaleBtn({ disabled, onClick, icon, label }: { disabled: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width: 30,
        height: 30,
        borderRadius: "6px",
        border: "1px solid var(--line)",
        background: "transparent",
        color: disabled ? "var(--line)" : "var(--tertiary)",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.2s, border-color 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={() => {
        if (ref.current && !disabled) {
          Object.assign(ref.current.style, {
            borderColor: "var(--blue)",
            color: "var(--blue-hover)",
          });
        }
      }}
      onMouseLeave={() => {
        if (ref.current && !disabled) {
          Object.assign(ref.current.style, {
            borderColor: "var(--line)",
            color: "var(--tertiary)",
          });
        }
      }}
    >
      {icon}
    </button>
  );
}
