import { useState, type FormEvent } from "react";
import { ArrowLeft, Plus, Trophy, ArrowRight } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../data";
import type { MyCompetition } from "../hooks/useCompetition";
import { competitionLabel } from "../hooks/useCompetition";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const CORAL       = "#E2503F";
const SLATE_DARK  = "#334155";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

interface Props {
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  myCompetitions: MyCompetition[];
  loadingCompetitions: boolean;
  onOpen: (competition: MyCompetition) => void;
  onJoinByCode: (code: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export default function CompetitionHomeView({ setView, session, authLoading, myCompetitions, loadingCompetitions, onOpen, onJoinByCode }: Props) {
  const [code, setCode] = useState("");

  function handleSubmitCode(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    onJoinByCode(code);
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>Competir</h1>

      {!authLoading && !session && (
        <div className="rounded-3xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}>
          <Trophy size={28} className="mb-3 opacity-90" />
          <div className="text-lg font-bold mb-1">Inicia sesión para competir</div>
          <p className="text-sm opacity-90 mb-4 leading-relaxed">
            Los retos se guardan en tu cuenta para que puedas jugarlos desde cualquier dispositivo.
          </p>
          <button
            onClick={() => setView("settings")}
            className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Ir a ajustes
          </button>
        </div>
      )}

      {session && (
        <>
          <div className="relative rounded-3xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}>
            <div className="text-xs font-semibold tracking-wide uppercase opacity-80">Reto grupal · hasta 6 jugadores</div>
            <div className="text-xl font-bold mt-1.5 mb-1.5">Reta a tus amigos</div>
            <p className="text-sm opacity-90 mb-4 max-w-[240px] leading-relaxed">
              Todos juegan el mismo set de kana o vocabulario — cada uno cuando pueda.
            </p>
            <button
              onClick={() => setView("competeCreate")}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: "#fff", color: PURPLE_DARK }}
            >
              <Plus size={15} /> Crear reto
            </button>
          </div>

          <form onSubmit={handleSubmitCode} className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_SECOND }}>¿Ya tienes un código?</div>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código del reto"
                className="flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm font-semibold border-[1.5px] outline-none"
                style={{ borderColor: BORDER, color: TEXT_MAIN }}
              />
              <button
                type="submit"
                disabled={!code.trim()}
                className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
              >
                Unirme <ArrowRight size={15} />
              </button>
            </div>
          </form>

          <div className="mt-8 text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Tus retos</div>

          {loadingCompetitions && <p className="text-sm mt-3" style={{ color: TEXT_SECOND }}>Cargando…</p>}

          {!loadingCompetitions && myCompetitions.length === 0 && (
            <p className="text-sm mt-3" style={{ color: TEXT_SECOND }}>Aún no tienes retos. Crea uno para empezar.</p>
          )}

          <div className="mt-2">
            {myCompetitions.map((c) => <CompetitionRow key={c.id} competition={c} onOpen={onOpen} />)}
          </div>
        </>
      )}
    </div>
  );
}

function statusChip(c: MyCompetition): { label: string; bg: string; color: string } {
  if (c.status === "completada") return { label: "Completado", bg: "#E9F7EF", color: "#2E9E5B" };
  if (c.hasSubmitted) return { label: "Esperando", bg: "#FBF1DE", color: "#C98A2E" };
  return { label: "Tu turno", bg: PURPLE, color: "#fff" };
}

function CompetitionRow({ competition, onOpen }: { competition: MyCompetition; onOpen: (c: MyCompetition) => void }) {
  const chip = statusChip(competition);
  const module = competition.quiz_config.module;
  const iconMeta = module === "hiragana"
    ? { bg: "#EFE7FB", color: PURPLE, glyph: "あ" }
    : module === "vocab"
    ? { bg: "#FBE7E4", color: CORAL, glyph: "本" }
    : { bg: "#F1F5F9", color: SLATE_DARK, glyph: "🕐" };
  return (
    <button
      onClick={() => onOpen(competition)}
      className="w-full flex items-center gap-3 py-3 border-b text-left"
      style={{ borderColor: BORDER }}
    >
      <span
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-semibold"
        style={{
          backgroundColor: iconMeta.bg,
          color: iconMeta.color,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {iconMeta.glyph}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: TEXT_MAIN }}>{competitionLabel(competition.quiz_config)}</div>
        <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>
          {competition.quiz_config.items.length} ítems · {competition.participantCount} jugador{competition.participantCount === 1 ? "" : "es"}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[11px] font-semibold" style={{ color: TEXT_SECOND }}>{formatDate(competition.created_at)}</span>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: chip.bg, color: chip.color }}>
          {chip.label}
        </span>
      </div>
    </button>
  );
}
