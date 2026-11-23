import { useEffect } from "react";
import { Target, X } from "lucide-react";
import type { GoalProgressNotice } from "../hooks/useGoals";

interface Props {
  notice: GoalProgressNotice | null;
  onDismiss: () => void;
  onOpen: () => void;
}

const VISIBLE_MS = 5000;

/** Small bottom toast after a finished session advances a shared goal (docs/GOALS_PLAN.md, Phase C). */
export default function GoalToast({ notice, onDismiss, onOpen }: Props) {
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(id);
  }, [notice, onDismiss]);

  if (!notice) return null;
  const done = notice.sessions >= notice.perDay;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-2xl pl-4 pr-2 py-3 shadow-lg text-white"
        style={{ background: done ? "linear-gradient(135deg, #2E9E5B, #1F7A45)" : "linear-gradient(135deg, #7B4FD4, #5533A8)" }}
      >
        <Target size={18} className="shrink-0" />
        <button onClick={onOpen} className="flex-1 min-w-0 text-left">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            {done ? "Tarea de hoy cumplida" : "Meta compartida"}
          </div>
          <div className="text-sm font-bold truncate">
            {notice.label} · {Math.min(notice.sessions, notice.perDay)}/{notice.perDay} hoy
          </div>
        </button>
        <button onClick={onDismiss} aria-label="Cerrar aviso" className="p-1.5 rounded-lg hover:bg-white/15">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
