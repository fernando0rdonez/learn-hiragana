import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Flame, UserPlus, Play } from "lucide-react";
import type { ViewName } from "../data";
import type { GoalBoard } from "../hooks/useGoals";
import {
  completionRate, dayStatus, goalDayNumber, goalDays, goalPhase, goalStreak,
  sessionLookup, targetLabel, todayProgress,
  type DayStatus, type GoalTask,
} from "../goals";
import { avatarSrc } from "../avatars";
import { toISODate } from "../utils";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const GREEN       = "#2E9E5B";
const AMBER       = "#C98A2E";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

const STATUS_LABEL: Record<DayStatus, string> = {
  done: "Cumplido",
  partial: "A medias",
  pending: "Hoy, pendiente",
  missed: "Sin estudiar",
  future: "Todavía no",
  beforeJoin: "Aún no se unía",
};

const WEEKDAY = ["D", "L", "M", "X", "J", "V", "S"];

function dayHeader(date: string): { weekday: string; day: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { weekday: WEEKDAY[new Date(y, m - 1, d).getDay()], day: d };
}

interface Props {
  goalId: string;
  setView: (v: ViewName) => void;
  loadBoard: (goalId: string) => Promise<GoalBoard | { error: string }>;
  onPractice: (task: GoalTask) => void;
  onInvite: () => void;
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; board: GoalBoard };

/** People × days grid for one shared goal, plus my tasks for today (docs/GOALS_PLAN.md, Phase D). */
export default function GoalBoardView({ goalId, setView, loadBoard, onPractice, onInvite }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const today = toISODate();

  useEffect(() => {
    let cancelled = false;
    loadBoard(goalId).then((result) => {
      if (cancelled) return;
      setState("error" in result ? { status: "error", message: result.error } : { status: "ready", board: result });
    });
    return () => { cancelled = true; };
  }, [goalId, loadBoard]);

  const rows = useMemo(() => {
    if (state.status !== "ready") return [];
    const { goal, members, checkins } = state.board;
    return members.map((m) => {
      const sessions = sessionLookup(checkins, m.userId);
      return {
        member: m,
        sessions,
        statuses: goalDays(goal).map((d) => dayStatus(goal, sessions, m.joinedDate, d, today)),
        streak: goalStreak(goal, sessions, m.joinedDate, today),
        rate: completionRate(goal, sessions, m.joinedDate, today),
      };
    });
  }, [state, today]);

  // Start the grid scrolled so today is visible on long (30-day) goals.
  const gridRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!gridRef.current || !todayColRef.current) return;
    const grid = gridRef.current;
    const col = todayColRef.current;
    grid.scrollLeft = Math.max(0, col.offsetLeft - grid.clientWidth / 2);
  }, [rows.length]);

  const back = (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={() => setView("goalHome")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
        <ArrowLeft size={14} /> Metas
      </button>
    </div>
  );

  if (state.status === "loading") return <div className="pb-8">{back}<p className="text-sm text-center pt-8" style={{ color: TEXT_SECOND }}>Cargando la meta…</p></div>;
  if (state.status === "error") return <div className="pb-8">{back}<p className="text-sm text-center pt-8" style={{ color: TEXT_SECOND }}>{state.message}</p></div>;

  const { goal, members } = state.board;
  const phase = goalPhase(goal, today);
  const days = goalDays(goal);
  const me = rows.find((r) => r.member.isMe);
  const myToday = me && phase === "active" ? todayProgress(goal, me.sessions, today) : [];
  const doneToday = members.length > 0 ? rows.filter((r) => r.statuses[days.indexOf(today)] === "done").length : 0;

  return (
    <div className="pb-8">
      {back}
      <h1 className="text-2xl font-bold mb-1 text-balance" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>{goal.title}</h1>
      <div className="flex items-center gap-3 mb-5">
        <p className="text-sm flex-1" style={{ color: TEXT_SECOND }}>
          {phase === "finished" ? "Terminada" : `Día ${goalDayNumber(goal, today)} de ${goal.duration_days}`} · {members.length} {members.length === 1 ? "persona" : "personas"}
          {phase === "active" && ` · ${doneToday} ya cumplió hoy`}
        </p>
        {phase !== "finished" && (
          <button
            onClick={onInvite}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border-[1.5px]"
            style={{ borderColor: "#D9CCF3", color: PURPLE }}
          >
            <UserPlus size={14} /> Invitar
          </button>
        )}
      </div>

      {myToday.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: "#F9F8FC" }}>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: TEXT_SECOND }}>Tu día de hoy</div>
          {myToday.map(({ task, sessions, remaining }) => (
            <div key={task.id} className="flex items-center gap-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: TEXT_MAIN }}>{targetLabel(task)}</div>
                <div className="flex items-center gap-1 mt-1.5" aria-label={`${sessions} de ${task.perDay} sesiones`}>
                  {Array.from({ length: task.perDay }, (_, i) => (
                    <span key={i} className="h-1.5 w-8 rounded-full" style={{ backgroundColor: i < sessions ? (remaining === 0 ? GREEN : PURPLE) : "#E4DEEF" }} />
                  ))}
                  <span className="text-xs font-semibold ml-1.5" style={{ color: TEXT_SECOND }}>{sessions}/{task.perDay}</span>
                </div>
              </div>
              {remaining > 0 ? (
                <button
                  onClick={() => onPractice(task)}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
                >
                  <Play size={13} /> Practicar
                </button>
              ) : (
                <span className="shrink-0 flex items-center gap-1 text-xs font-bold" style={{ color: GREEN }}>
                  <Check size={15} /> Listo
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_SECOND }}>Quién va cumpliendo</div>
      <div ref={gridRef} className="overflow-x-auto rounded-2xl border-[1.5px]" style={{ borderColor: BORDER }}>
        <div className="inline-flex flex-col min-w-full">
          {/* Day header */}
          <div className="flex items-end">
            <div className="sticky left-0 z-10 shrink-0 w-32 bg-white" />
            {days.map((d) => {
              const h = dayHeader(d);
              const isToday = d === today;
              return (
                <div key={d} ref={isToday ? todayColRef : undefined} className="shrink-0 w-8 text-center pt-2 pb-1">
                  <div className="text-[10px] font-semibold" style={{ color: isToday ? PURPLE : TEXT_SECOND }}>{h.weekday}</div>
                  <div className="text-xs font-bold" style={{ color: isToday ? PURPLE : TEXT_MAIN }}>{h.day}</div>
                </div>
              );
            })}
            <div className="shrink-0 w-2" />
          </div>

          {rows.map(({ member, statuses, streak, rate }) => (
            <div key={member.userId} className="flex items-center border-t" style={{ borderColor: BORDER }}>
              <div className="sticky left-0 z-10 shrink-0 w-32 bg-white flex items-center gap-2 pl-3 pr-2 py-2">
                <img src={avatarSrc(member.avatarId)} alt="" className="shrink-0 w-7 h-7 rounded-full object-cover border" style={{ borderColor: BORDER }} />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: TEXT_MAIN }}>{member.isMe ? "Tú" : member.displayName}</div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: TEXT_SECOND }}>
                    <span className="flex items-center gap-0.5" title="Racha en esta meta">
                      <Flame size={10} style={{ color: streak > 0 ? "#E2503F" : undefined }} />{streak}
                    </span>
                    {rate !== null && <span title="Días cumplidos">{Math.round(rate * 100)}%</span>}
                  </div>
                </div>
              </div>
              {statuses.map((s, i) => (
                <div key={days[i]} className="shrink-0 w-8 flex justify-center py-2">
                  <DayCell status={s} label={`${member.isMe ? "Tú" : member.displayName}, ${days[i]}: ${STATUS_LABEL[s]}`} />
                </div>
              ))}
              <div className="shrink-0 w-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px] font-semibold" style={{ color: TEXT_SECOND }}>
        {(["done", "partial", "missed", "pending"] as DayStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5"><DayCell status={s} small /> {STATUS_LABEL[s]}</span>
        ))}
      </div>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: TEXT_SECOND }}>
        Un día cuenta como cumplido cuando completas todas las tareas. La racha y el % solo cuentan desde que cada persona se unió.
      </p>
    </div>
  );
}

function DayCell({ status, label, small }: { status: DayStatus; label?: string; small?: boolean }) {
  const size = small ? "w-3.5 h-3.5" : "w-6 h-6";
  const common = `${size} rounded-md flex items-center justify-center shrink-0`;
  const a11y = label ? { role: "img", "aria-label": label, title: label } : { "aria-hidden": true };
  switch (status) {
    case "done":
      return <span {...a11y} className={common} style={{ backgroundColor: GREEN }}>{!small && <Check size={14} color="#fff" strokeWidth={3} />}</span>;
    case "partial":
      return <span {...a11y} className={common} style={{ background: `linear-gradient(135deg, ${AMBER} 50%, #FBF1DE 50%)` }} />;
    case "pending":
      return <span {...a11y} className={common} style={{ border: `1.5px dashed ${PURPLE}` }} />;
    case "missed":
      return <span {...a11y} className={common} style={{ backgroundColor: "#EEEAF4" }} />;
    case "future":
      return <span {...a11y} className={common} style={{ border: `1.5px solid ${BORDER}` }} />;
    case "beforeJoin":
      return <span {...a11y} className={`${common} text-xs`} style={{ color: "#C9C2D9" }}>–</span>;
  }
}
