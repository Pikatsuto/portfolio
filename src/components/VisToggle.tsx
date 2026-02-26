import { useRef } from "react";

interface Props {
  visible: boolean;
  postUrl: string;
}

export default function VisToggle({ visible, postUrl }: Props) {
  const labelRef = useRef<HTMLLabelElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const current = useRef(visible);

  const toggle = async () => {
    const newVal = !current.current;
    current.current = newVal;

    // Update DOM directly (no re-render flash)
    if (labelRef.current) {
      labelRef.current.style.color = newVal ? "var(--green)" : "var(--tertiary)";
    }
    if (boxRef.current) {
      boxRef.current.style.borderColor = newVal ? "var(--green)" : "var(--line)";
      boxRef.current.style.background = newVal ? "color-mix(in srgb, var(--green) 12%, transparent)" : "transparent";
      boxRef.current.innerHTML = newVal ? '<span style="color:var(--green);font-size:0.7rem;font-weight:700">✓</span>' : "";
    }
    if (textRef.current) {
      textRef.current.textContent = newVal ? "Visible" : "Brouillon";
    }

    await fetch(postUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: newVal }),
    });
  };

  return (
    <label
      ref={labelRef}
      onClick={toggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        color: visible ? "var(--green)" : "var(--tertiary)",
        userSelect: "none",
        transition: "color 0.2s",
      }}
    >
      <div
        ref={boxRef}
        style={{
          width: 18,
          height: 18,
          borderRadius: "4px",
          border: `1.5px solid ${visible ? "var(--green)" : "var(--line)"}`,
          background: visible ? "color-mix(in srgb, var(--green) 12%, transparent)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        {visible && <span style={{ color: "var(--green)", fontSize: "0.7rem", fontWeight: 700 }}>✓</span>}
      </div>
      <span ref={textRef}>{visible ? "Visible" : "Brouillon"}</span>
    </label>
  );
}