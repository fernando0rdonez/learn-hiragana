import { useEffect, useState } from "react";
import { ArrowLeft, Target } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../data";
import type { GoalActionResult, GoalPreview } from "../hooks/useGoals";
import { MAX_PLAYERS } from "../hooks/useCompetition";
import { goalDayNumber, taskLabel } from "../goals";
import { toISODate } from "../utils";
import foxImg from "../assets/character/fox-neutral.png";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; preview: GoalPreview };

interface Props {
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  code: string | null;
  previewGoal: (code: string) => Promise<GoalPreview | { error: string }>;
  joinGoal: (goalId: string) => Promise<GoalActionResult>;
  consumeGoalCode: () => void;
  onJoined: (goalId: string) => void;
}

export default function GoalJoinView({ setView, session, authLoading, code, previewGoal, joinGoal, consumeGoalCode, onJoined }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code || !session) return;
    let cancelled = false;
    previewGoal(code).then((result) => {
      if (cancelled) return;
      setState("error" in result ? { status: "error", message: result.error } : { status: "ready", preview: result });
    });
    return () => { cancelled = true; };
  }, [code, session, previewGoal]);

  async function handleJoin(goalId: string) {
    setJoining(true);
    const result = await joinGoal(goalId);
    setJoining(false);
    if (result.ok) {
      consumeGoalCode();
      onJoined(goalId);
    } else {
      setState({ status: "error", message: result.error });
    }
  }

  if (!authLoading && !session) {
    return (
      <div className="pb-8 text-center pt-8">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4" />
        <p className="text-lg font-bold mb-2" style={{ color: TEXT_MAIN }}>Inicia sesión para unirte</p>
        <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>Guardamos tu invitación. Vuelve aquí después de iniciar sesión.</p>
        <button
          onClick={() => setView("settings")}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
        >
          Ir a ajustes
        </button>
      </div>
    );
  }

  // Leaving the join screen drops the stashed code; otherwise App's session effect
  // would bounce every reload back here (e.g. after a bad or already-used code).
  function leave() {
    consumeGoalCode();
    setView("goalHome");
  }

  const errorMessage = !code ? "No hay ninguna meta pendiente por aceptar." : state.status === "error" ? state.message : null;
  if (errorMessage) {
    return (
      <div className="pb-8 text-center pt-8">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4 opacity-70" />
        <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>{errorMessage}</p>
        <button onClick={leave} className="text-sm font-semibold" style={{ color: PURPLE }}>
          Ir a Metas
        </button>
      </div>
    );
  }

  if (state.status !== "ready") {
    return <p className="text-sm text-center pt-8" style={{ color: TEXT_SECOND }}>Buscando la meta…</p>;
  }

  const { preview } = state;
  const { goal } = preview;
  const blockedReason = preview.finished
    ? "Esta meta ya terminó."
    : preview.full && !preview.alreadyJoined
    ? `Esta meta ya llegó al máximo de ${MAX_PLAYERS} personas.`
    : null;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={leave} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Metas
        </button>
      </div>
      <div className="text-center pt-2 pb-2">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4" />
        <p className="text-lg font-extrabold text-balance" style={{ color: TEXT_MAIN }}>
          {preview.isCreator ? "Tu meta" : <><span style={{ color: PURPLE }}>{preview.creatorName}</span> te invitó a una meta</>}
        </p>
        <p className="text-sm mt-1.5" style={{ color: TEXT_SECOND }}>
          {goal.duration_days} días · {preview.finished ? "terminada" : `va en el día ${goalDayNumber(goal, toISODate())}`}
        </p>
      </div>

      <div className="text-[11px] font-bold uppercase tracking-wide mt-5 mb-2" style={{ color: TEXT_SECOND }}>Cada día</div>
      <div className="rounded-2xl border-[1.5px]" style={{ borderColor: BORDER }}>
        {goal.tasks.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3" style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}>
            <Target size={16} className="shrink-0" style={{ color: PURPLE }} />
            <span className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{taskLabel(t)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs mt-2.5 px-1" style={{ color: TEXT_SECOND }}>
        <span>Código {goal.invite_code}</span>
        <span>{preview.participantCount} de {MAX_PLAYERS} ya se unieron</span>
      </div>

      {blockedReason ? (
        <p className="text-center text-sm mt-6" style={{ color: TEXT_SECOND }}>{blockedReason}</p>
      ) : (
        <>
          <button
            onClick={() => void handleJoin(goal.id)}
            disabled={joining}
            className="w-full mt-6 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
          >
            {joining ? "Uniéndote…" : preview.alreadyJoined ? "Ya estás en esta meta · Ver" : "Unirme a la meta"}
          </button>
          <p className="text-xs text-center mt-2.5 leading-relaxed" style={{ color: TEXT_SECOND }}>
            Los días cuentan desde que te unes. Todos verán qué días cumpliste.
          </p>
        </>
      )}
    </div>
  );
}
