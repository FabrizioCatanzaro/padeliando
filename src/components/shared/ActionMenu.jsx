import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

// Menú de acciones colapsado tras un botón de elipsis (usado en mobile).
export default function ActionMenu({ items, label = "Acciones" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!items?.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="bg-transparent border-0 text-muted cursor-pointer px-1.5 py-1 rounded-sm"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 min-w-[180px] bg-surface border border-border-strong rounded-md shadow-lg overflow-hidden"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); item.onClick(); }}
              className={`flex items-center gap-2.5 w-full text-left bg-transparent border-0 px-3.5 py-2.5 font-sans text-[13px] cursor-pointer hover:bg-base transition-colors ${item.danger ? "text-danger" : "text-content"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
