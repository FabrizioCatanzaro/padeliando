import { useState, useRef, useEffect } from "react";
import S from "../../styles/theme";
import { normalize } from "../../utils/helpers";

/**
 * Text input with autocomplete from the global players DB.
 * Shows suggestions as a dropdown. Selecting one fills the field.
 * If the name already exists in the DB, a "✓ ya existe" badge appears.
 */
export default function PlayerInput({ value, onChange, placeholder, dbPlayers, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const suggestions = value.trim().length >= 1
    ? dbPlayers.filter(
        (p) => normalize(p.name).includes(normalize(value)) && normalize(p.name) !== normalize(value)
      )
    : [];

  const isExisting = dbPlayers.some((p) => normalize(p.name) === normalize(value));

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <div style={{ position: "relative" }}>
        <input
          style={{ ...S.input, marginBottom: 0, paddingRight: isExisting ? 90 : 14, ...style }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {value.trim() && (
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontSize: 10, fontFamily: "'Courier New', monospace", letterSpacing: 1,
            color: isExisting ? "#4af07a" : "#e8f04a",
            pointerEvents: "none",
          }}>
            {isExisting ? "✓ EXISTE" : "NUEVO"}
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "#111827", border: "1px solid #2a3040", borderTop: "none",
          borderRadius: "0 0 4px 4px", maxHeight: 160, overflowY: "auto",
        }}>
          {suggestions.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => { onChange(p.name); setOpen(false); }}
              style={{
                padding: "9px 14px", cursor: "pointer", fontSize: 14,
                color: "#ccc", fontFamily: "'Barlow', sans-serif",
                borderBottom: "1px solid #1a2030",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1a2030"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}