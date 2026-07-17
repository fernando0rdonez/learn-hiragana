import { useEffect } from "react";
import { Flame, Check, Sparkles, Target, Shield, Crown, Award, Star, type LucideIcon } from "lucide-react";
import type { StreakData, DailyProgress } from "../types";
import { DAILY_GOAL, STREAK_MILESTONES, weekAroundToday } from "../streak";
import { toISODate } from "../utils";
import { fireConfetti } from "../components/ConfettiOverlay";
import foxCelebrating from "../assets/character/fox-celebrating.png";

interface Props {
  streak: StreakData;
  dailyProgress: DailyProgress;
  /** true solo justo al terminar la sesión que cumplió la meta del día — dispara confeti y el copy de celebración. */
  celebrate: boolean;
  ctaLabel: string;
  onContinue: () => void;
}

const MILESTONE_ICONS: LucideIcon[] = [Sparkles, Target, Shield, Award, Crown, Star];

export default function StreakCelebrationView({ streak, dailyProgress, celebrate, ctaLabel, onContinue }: Props) {
  useEffect(() => {
    if (celebrate) fireConfetti();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = toISODate();
  const goalMetToday = dailyProgress.date === today && dailyProgress.correctToday >= DAILY_GOAL;
  const correctToday = dailyProgress.date === today ? dailyProgress.correctToday : 0;
  // practiceDates puede no traer el día de hoy todavía (racha ganada antes de que este campo
  // existiera, o el registro se hizo con una versión anterior de la app) — dailyProgress es la
  // fuente de verdad más reciente, así que la fila semanal no debe contradecir el mensaje de arriba.
  const week = weekAroundToday(streak.practiceDates, today)
    .map((day) => (day.isToday && goalMetToday ? { ...day, done: true } : day));
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > streak.longest);

  return (
    <div className="flex flex-col items-center gap-6 pt-4 pb-8 text-center">
      <div className="flex flex-col items-center">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: "radial-gradient(circle at 50% 40%, rgba(245,166,35,0.28), transparent 70%)" }}
        >
          <Flame size={72} strokeWidth={1.5} style={{ color: "#F5A623", fill: "#FFCF6E" }} />
        </div>
        <div
          className="text-6xl font-extrabold -mt-1"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#B8790E" }}
        >
          {streak.current}
        </div>
        <div className="text-xl font-extrabold" style={{ color: "#1A1A2E" }}>
          día{streak.current === 1 ? "" : "s"} de racha
        </div>
        <p className="text-sm mt-1.5 max-w-xs" style={{ color: "#6B6259" }}>
          {celebrate ? (
            <>¡Meta del día cumplida! <b style={{ color: "#1A1A2E" }}>{Math.min(correctToday, DAILY_GOAL)}/{DAILY_GOAL}</b> respuestas correctas.</>
          ) : goalMetToday ? (
            <>Ya cumpliste la meta de hoy — <b style={{ color: "#1A1A2E" }}>{Math.min(correctToday, DAILY_GOAL)}/{DAILY_GOAL}</b> respuestas correctas. ¡Vuelve mañana!</>
          ) : streak.current === 0 ? (
            <>Aún no tienes una racha activa. Practica hoy para empezar una.</>
          ) : (
            <>Llevas <b style={{ color: "#1A1A2E" }}>{correctToday}/{DAILY_GOAL}</b> respuestas correctas hoy — sigue practicando para no perder tu racha.</>
          )}
        </p>

        <div
          className="flex items-center gap-2.5 mt-3.5 pl-2 pr-4 py-2 rounded-full"
          style={{ backgroundColor: "#FFF4E5" }}
        >
          <img src={foxCelebrating} alt="" className="w-11 h-11 object-contain" />
          <span className="text-xs font-semibold text-left" style={{ color: "#B8790E" }}>
            {celebrate || goalMetToday ? "Kitsu está orgulloso de ti hoy" : "Kitsu te espera para seguir practicando"}
          </span>
        </div>
      </div>

      <div className="w-full max-w-xs rounded-2xl bg-white border p-4" style={{ borderColor: "#EDE6DA" }}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs font-bold text-left" style={{ color: "#1A1A2E" }}>Esta semana</h3>
          <span className="text-[11px] font-semibold" style={{ color: "#A69D92" }}>récord: {streak.longest} días</span>
        </div>
        <div className="flex justify-between mt-3.5">
          {week.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
              <span
                className="text-[11px] font-bold uppercase"
                style={{ color: day.isToday ? "#7B4FD4" : "#A69D92" }}
              >
                {day.label}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={
                  day.done
                    ? { background: "linear-gradient(160deg, #F5A623, #B8790E)", color: "#fff" }
                    : {
                        backgroundColor: "#FAF7F2",
                        color: day.isFuture ? "#D8D0C4" : "#A69D92",
                        border: `2px solid ${day.isToday ? "#7B4FD4" : "#EDE6DA"}`,
                      }
                }
              >
                {day.done ? <Check size={16} /> : "·"}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-baseline justify-between mt-5">
          <h3 className="text-xs font-bold text-left" style={{ color: "#1A1A2E" }}>Hitos</h3>
          <span className="text-[11px] font-semibold" style={{ color: "#A69D92" }}>
            {STREAK_MILESTONES.filter((m) => streak.longest >= m.days).length} de {STREAK_MILESTONES.length} logrados
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 mt-3">
          {STREAK_MILESTONES.map((milestone, i) => {
            const reached = streak.longest >= milestone.days;
            const Icon = MILESTONE_ICONS[i % MILESTONE_ICONS.length];
            return (
              <div
                key={milestone.days}
                className="relative flex flex-col items-center gap-1.5 rounded-2xl py-2.5"
                style={{
                  backgroundColor: reached ? "#F4EEFC" : "#FAF7F2",
                  border: `1px solid ${reached ? "#E0D8F8" : "#EDE6DA"}`,
                }}
              >
                {reached && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ backgroundColor: "#1E9E6B", width: 18, height: 18 }}
                  >
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={reached ? { background: "linear-gradient(160deg, #7B4FD4, #5533A8)", color: "#fff" } : { backgroundColor: "#EDE6DA", color: "#A69D92" }}
                >
                  <Icon size={19} />
                </div>
                <div className="text-xs font-extrabold" style={{ color: reached ? "#5533A8" : "#1A1A2E" }}>{milestone.days}d</div>
                <div className="text-[10px] font-semibold" style={{ color: "#A69D92" }}>{milestone.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full max-w-xs px-8 py-3.5 rounded-2xl text-white font-bold"
        style={{ background: "linear-gradient(90deg, #7B4FD4, #5533A8)" }}
      >
        {ctaLabel}
      </button>
      <p className="text-[11px] -mt-3" style={{ color: "#A69D92" }}>
        Meta diaria: {DAILY_GOAL} respuestas correctas
        {nextMilestone && <> · próximo hito: {nextMilestone.name} ({nextMilestone.days}d)</>}
      </p>
    </div>
  );
}
