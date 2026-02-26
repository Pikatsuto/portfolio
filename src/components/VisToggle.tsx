import { useRef } from "react";

interface Props {
  visible: boolean;
  postUrl: string;
}

export default function VisToggle({ visible, postUrl }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const current = useRef(visible);

  const toggle = async () => {
    const newVal = !current.current;
    current.current = newVal;
    if (ref.current) {
      ref.current.textContent = newVal ? "✓" : "○";
      ref.current.style.color = newVal
        ? "var(--green)"
        : "var(--tertiary)";
    }
    await fetch(postUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: newVal }),
    });
  };

  return (
    <button
      ref={ref}
      onClick={toggle}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "0.9rem",
        color: visible ? "var(--green)" : "var(--tertiary)",
        padding: "0.1rem 0.3rem",
        fontFamily: "sans-serif",
      }}
      title={visible ? "Visible" : "Masqué"}
    >
      {visible ? "✓" : "○"}
    </button>
  );
}
