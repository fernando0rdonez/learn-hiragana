import { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../data";
import type { LeaderboardEntry, MyCompetition, RivalHistory } from "../hooks/useCompetition";
import { competitionLabel } from "../hooks/useCompetition";
import foxImg from "../assets/character/fox-neutral.png";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";
const SURFACE     = "#F9F8FC";
const SUCCESS     = "#2E9E5B";
const SUCCESS_BG  = "#E9F7EF";
const WAITING     = "#C98A2E";
const WAITING_BG  = "#FBF1DE";

interface Props {
  setView: (v: ViewName) => void;
  session: Session | null;
  competitionId: string | null;
  myCompetitions: MyCompetition[];
  leaderboard: (competitionId: string) => Promise<LeaderboardEntry[]>;
  rivalHistories: () => Promise<Map<string, RivalHistory>>;
  setActiveCompetitionId: (id: string | null) => void;
}

const ORDINAL_SUFFIX: Record<number, string> = { 1: "er", 2: "do", 3: "er", 4: "to", 5: "to", 6: "to" };
function ordinal(rank: number): string {
  return `${rank}${ORDINAL_SUFFIX[rank] ?? "to"}`;
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; entries: LeaderboardEntry[]; rivals: Map<string, RivalHistory> };

export default function CompetitionResultView({
  setView, session, competitionId, myCompetitions, leaderboard, rivalHistories, setActiveCompetitionId,
}: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!competitionId) {
      setState({ status: "error", message: "No hay ningún resultado que mostrar." });
      return;
    }
    let cancelled = false;
    const myId = session?.user.id;

    async function load(isRetry: boolean) {
      const [entries, rivals] = await Promise.all([leaderboard(competitionId!), rivalHistories()]);
      if (cancelled) return;
      const mineIsIn = entries.some((e) => e.userId === myId && e.submitted);
      // El insert de submitResult corre en segundo plano al terminar el quiz — si el usuario
      // llega aquí antes de que aterrice, reintentamos una vez en vez de mostrar un resultado roto.
      if (!mineIsIn && !isRetry) {
        setTimeout(() => { if (!cancelled) void load(true); }, 900);
        return;
      }
      setState({ status: "ready", entries, rivals });
    }

    setState({ status: "loading" });
    void load(false);
    return () => { cancelled = true; };
  }, [competitionId, leaderboard, rivalHistories, session]);

  function handleLeave() {
    setActiveCompetitionId(null);
    setView("competeHome");
  }

  if (state.status === "loading") {
    return <p className="text-sm text-center pt-8" style={{ color: TEXT_SECOND }}>Cargando resultado…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="pb-8 text-center pt-8">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4 opacity-70" />
        <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>{state.message}</p>
        <button onClick={handleLeave} className="text-sm font-semibold" style={{ color: PURPLE }}>
          Ir a Competir
        </button>
      </div>
    );
  }

  const competition = myCompetitions.find((c) => c.id === competitionId);
  if (!competition) {
    return (
      <div className="pb-8 text-center pt-8">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4 opacity-70" />
        <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>No encontramos este reto.</p>
        <button onClick={handleLeave} className="text-sm font-semibold" style={{ color: PURPLE }}>
          Ir a Competir
        </button>
      </div>
    );
  }

  const { entries } = state;
  const submittedRanked = entries
    .filter((e) => e.submitted)
    .map((e) => ({ ...e, rank: 1 + entries.filter((o) => o.submitted && (o.score ?? 0) > (e.score ?? 0)).length }));
  const pendingEntries = entries.filter((e) => !e.submitted);
  const me = submittedRanked.find((e) => e.isMe);
  const completed = competition.status === "completada";
  const topScore = submittedRanked[0]?.score ?? 0;
  const winners = submittedRanked.filter((e) => e.score === topScore);
  const missingCount = competition.participantCount - submittedRanked.length;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleLeave} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Competir
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>Resultado</h1>

      <div
        className="relative rounded-3xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        <div className="text-xs font-semibold tracking-wide uppercase opacity-80">
          {competitionLabel(competition.quiz_config)} · {competition.quiz_config.items.length} ítems
        </div>

        {me ? (
          completed ? (
            <>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>{me.rank}</span>
                <span className="text-sm font-bold opacity-90">{ordinal(me.rank)} lugar</span>
              </div>
              <div className="text-sm opacity-90 mt-1">{me.correct} de {me.total} correctas</div>
            </>
          ) : (
            <>
              <div className="text-5xl font-bold mt-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {me.total ? Math.round(((me.correct ?? 0) / me.total) * 100) : 0}%
              </div>
              <div className="text-sm opacity-90 mt-1">{me.correct} de {me.total} correctas · tu resultado ya quedó guardado</div>
              {missingCount > 0 && (
                <div className="mt-3 text-xs rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
                  Esperando a que {missingCount} jugador{missingCount === 1 ? "" : "es"} más complete{missingCount === 1 ? "" : "n"} el reto.
                </div>
              )}
            </>
          )
        ) : (
          <div className="text-sm opacity-90 mt-2">Aún no has jugado este reto.</div>
        )}

        <Trophy size={26} className="absolute top-4 right-4 opacity-90" />
      </div>

      {completed && me && (
        me.rank === 1 ? (
          winners.length > 1 ? (
            <div className="mt-3 rounded-2xl px-3.5 py-3 text-sm font-bold" style={{ backgroundColor: WAITING_BG, color: WAITING }}>
              🤝 Empate en el primer lugar con {winners.filter((w) => !w.isMe).map((w) => w.displayName).join(", ")}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl px-3.5 py-3 text-sm font-bold" style={{ backgroundColor: SUCCESS_BG, color: SUCCESS }}>
              🏆 ¡Ganaste este reto!
            </div>
          )
        ) : (
          <p className="mt-3 text-xs text-center" style={{ color: TEXT_SECOND }}>
            🏆 Ganó {winners.length > 1 ? `${winners.map((w) => w.displayName).join(" y ")} (empate)` : winners[0]?.displayName}
          </p>
        )
      )}

      <div className="text-[11px] font-bold uppercase tracking-wide mt-6 mb-2.5" style={{ color: TEXT_SECOND }}>Tabla de posiciones</div>

      {submittedRanked.map((e) => (
        <LeaderboardRow key={e.userId} entry={e} />
      ))}
      {pendingEntries.map((e) => (
        <div key={e.userId} className="flex items-center gap-2.5 py-2.5 px-2 opacity-55">
          <span className="shrink-0 w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center text-xs" style={{ borderColor: BORDER, color: TEXT_SECOND }}>·</span>
          <div className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{e.displayName}</div>
          <div className="text-xs ml-auto" style={{ color: TEXT_SECOND }}>Aún no ha jugado</div>
        </div>
      ))}

      {completed && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wide mt-7 mb-2.5" style={{ color: TEXT_SECOND }}>Historial con rivales</div>
          {submittedRanked.filter((e) => !e.isMe).length === 0 && (
            <p className="text-sm" style={{ color: TEXT_SECOND }}>Sin rivales aún en este reto.</p>
          )}
          {submittedRanked.filter((e) => !e.isMe).map((e) => (
            <RivalCard key={e.userId} name={e.displayName} stats={state.rivals.get(e.userId)} />
          ))}
        </>
      )}

      <button
        onClick={handleLeave}
        className="w-full mt-7 rounded-2xl py-3.5 text-sm font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        Volver a Competir
      </button>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry & { rank: number } }) {
  const badgeStyle =
    entry.rank === 1 ? { backgroundColor: PURPLE, color: "#fff" } :
    entry.rank === 2 ? { backgroundColor: "#E2DAF5", color: PURPLE_DARK } :
    entry.rank === 3 ? { backgroundColor: SURFACE, color: TEXT_SECOND, border: `1.5px solid ${BORDER}` } :
    { backgroundColor: "transparent", color: TEXT_SECOND, border: `1.5px solid ${BORDER}` };
  const pct = entry.total ? Math.round(((entry.correct ?? 0) / entry.total) * 100) : 0;

  return (
    <div
      className="flex items-center gap-2.5 py-2.5 px-2 rounded-2xl mb-1"
      style={entry.isMe ? { backgroundColor: SURFACE, border: `1.5px solid ${PURPLE}` } : undefined}
    >
      <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold" style={badgeStyle}>
        {entry.rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: TEXT_MAIN }}>
          <span className="truncate">{entry.displayName}</span>
          {entry.isMe && (
            <span className="text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: PURPLE }}>TÚ</span>
          )}
        </div>
        <div className="text-xs" style={{ color: TEXT_SECOND }}>{entry.correct} / {entry.total} correctas</div>
      </div>
      <div className="text-sm font-extrabold shrink-0" style={{ color: TEXT_MAIN }}>{pct}%</div>
    </div>
  );
}

function RivalCard({ name, stats }: { name: string; stats: RivalHistory | undefined }) {
  const wins   = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const ties   = stats?.ties ?? 0;
  const streak = stats?.streak ?? 0;
  const played = wins + losses + ties;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 mb-2" style={{ border: `1px solid ${BORDER}` }}>
      <span
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold"
        style={{ backgroundColor: SURFACE, color: PURPLE_DARK }}
      >
        {initials(name)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: TEXT_MAIN }}>{name}</div>
        <div className="text-[11px]" style={{ color: TEXT_SECOND }}>
          {played} reto{played === 1 ? "" : "s"} jugado{played === 1 ? "" : "s"} · {wins}V – {losses}D{ties > 0 ? ` – ${ties}E` : ""}
        </div>
      </div>
      {Math.abs(streak) >= 2 && (
        <span
          className="text-[10px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap shrink-0"
          style={streak > 0 ? { backgroundColor: SUCCESS_BG, color: SUCCESS } : { backgroundColor: "#FBEAE6", color: "#C03A1E" }}
        >
          {streak > 0 ? `Racha × ${streak}` : `${Math.abs(streak)} derrotas seguidas`}
        </span>
      )}
    </div>
  );
}
