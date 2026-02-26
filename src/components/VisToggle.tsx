import { useRef } from "react";
import { Check } from "lucide-react";

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
      boxRef.current.innerHTML = newVal ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : "";
    }
    if (textRef.current) {
      textRef.current.textContent = newVal ? "Visible" : "Brouillon";
    }

    // Update the parent item's title (dimmed class toggle)
    const item = labelRef.current?.closest(".post-item, .doc-item");
    if (item) {
      const title = item.querySelector(".post-title, .doc-title");
      if (title) {
        title.classList.toggle("dimmed", !newVal);
      }
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
        {visible && <Check size={12} color="var(--green)" strokeWidth={3} />}
      </div>
      <span ref={textRef}>{visible ? "Visible" : "Brouillon"}</span>
    </label>
  );
}