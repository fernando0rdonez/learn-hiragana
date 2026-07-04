import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { Play } from "lucide-react";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Props {
  count: number;
  disabled: boolean;
  onClick: () => void;
  accent: string;
  targetRef: RefObject<HTMLElement | null>;
}

// Compact floating "start session" button that stays reachable while
// scrolling past the category grid, and hides once the real button
// (targetRef) is on screen — so it reads as morphing into that button.
// Only shows while the real button is still *below* the viewport; once the
// user scrolls past it (e.g. into other sections further down the page) it
// stays hidden instead of popping back up.
export default function FloatingStartButton({ count, disabled, onClick, accent, targetRef }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top > 0),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center transition-all duration-200 ease-out"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.85)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="w-full max-w-xl px-4 flex justify-end">
        <button
          disabled={disabled}
          onClick={onClick}
          aria-label="Comenzar sesión"
          className="flex items-center gap-1.5 rounded-full text-white font-semibold px-4 py-3.5 disabled:opacity-40 transition-transform active:scale-95"
          style={{ backgroundColor: accent, boxShadow: `0 6px 18px ${hexToRgba(accent, 0.35)}` }}
        >
          <Play size={16} />
          <span className="text-sm">{count}</span>
        </button>
      </div>
    </div>
  );
}
