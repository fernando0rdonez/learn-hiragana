import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../data";
import type { CompetitionPreview } from "../hooks/useCompetition";
import foxImg from "../assets/character/fox-neutral.png";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const CORAL       = "#E2503F";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";

interface Props {
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  code: string | null;
  previewCompetition: (code: string) => Promise<CompetitionPreview | { error: string }>;
  joinCompetition: (competitionId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  consumeInviteCode: () => void;
}

function moduleLabel(module: "hiragana" | "vocab"): string {
  return module === "hiragana" ? "Hiragana — Reconocimiento" : "Vocabulario — Deletrear";
}

function hoursLeft(expiresAt: string): number {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 3_600_000));
}

export default function CompetitionJoinView({ setView, session, authLoading, code, previewCompetition, joinCompetition, consumeInviteCode }: Props) {
  const [state, setState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; preview: CompetitionPreview }>({ status: "loading" });
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) {
      setState({ status: "error", message: "No hay ningún reto pendiente por aceptar." });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    previewCompetition(code).then((result) => {
      if (cancelled) return;
      if ("error" in result) setState({ status: "error", message: result.error });
      else setState({ status: "ready", preview: result });
    });
    return () => { cancelled = true; };
  }, [code, previewCompetition]);

  async function handleJoin(competitionId: string) {
    setJoining(true);
    const result = await joinCompetition(competitionId);
    setJoining(false);
    if (result.ok) {
      consumeInviteCode();
      setView("competeHome");
    } else {
      setState({ status: "error", message: result.error });
    }
  }

  if (!authLoading && !session) {
    return (
      <div className="pb-8 text-center pt-8">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4" />
        <p className="text-lg font-bold mb-2" style={{ color: TEXT_MAIN }}>Inicia sesión para unirte</p>
        <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>Guardamos tu invitación — vuelve aquí después de iniciar sesión.</p>
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

  if (state.status === "loading") {
    return <p className="text-sm text-center pt-8" style={{ color: TEXT_SECOND }}>Buscando el reto…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="pb-8 text-center pt-8">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4 opacity-70" />
        <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>{state.message}</p>
        <button onClick={() => setView("competeHome")} className="text-sm font-semibold" style={{ color: PURPLE }}>
          Ir a Competir
        </button>
      </div>
    );
  }

  const { preview } = state;
  const isHiragana = preview.competition.quiz_config.module === "hiragana";
  const blocked = preview.expired || preview.full;

  return (
    <div className="pb-8">
      <div className="text-center pt-2 pb-2">
        <img src={foxImg} alt="" className="w-20 h-20 mx-auto mb-4" />
        <p className="text-lg font-extrabold text-balance" style={{ color: TEXT_MAIN }}>
          <span style={{ color: PURPLE }}>{preview.creatorName}</span> te invitó a un reto
        </p>
        <p className="text-sm mt-1.5" style={{ color: TEXT_SECOND }}>{moduleLabel(preview.competition.quiz_config.module)}</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl p-4 mt-4" style={{ backgroundColor: "#F9F8FC" }}>
        <span
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{
            backgroundColor: isHiragana ? "#EFE7FB" : "#FBE7E4",
            color: isHiragana ? PURPLE : CORAL,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {isHiragana ? "あ" : "本"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold" style={{ color: TEXT_MAIN }}>{moduleLabel(preview.competition.quiz_config.module)}</div>
          <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>
            {preview.competition.quiz_config.items.length} ítems · mismo set para todos
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs mt-2.5 px-1" style={{ color: TEXT_SECOND }}>
        <span>Código {preview.competition.invite_code}</span>
        <span>{preview.expired ? "Expirado" : `Expira en ${hoursLeft(preview.competition.expires_at)}h`}</span>
      </div>

      <p className="text-center text-sm font-semibold mt-5" style={{ color: TEXT_SECOND }}>
        {preview.participantCount} de 6 ya se unieron
      </p>

      {blocked ? (
        <p className="text-center text-sm mt-4" style={{ color: TEXT_SECOND }}>
          {preview.expired ? "Este reto ya expiró." : "Este reto ya llegó al máximo de 6 jugadores."}
        </p>
      ) : (
        <>
          <button
            onClick={() => void handleJoin(preview.competition.id)}
            disabled={joining}
            className="w-full mt-5 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
          >
            {joining ? "Uniéndote…" : "Unirme al reto"}
          </button>
          <p className="text-xs text-center mt-2.5 leading-relaxed" style={{ color: TEXT_SECOND }}>
            Jugarás exactamente el mismo set que el resto — nada de suerte, solo quién sabe más.
          </p>
        </>
      )}
    </div>
  );
}
