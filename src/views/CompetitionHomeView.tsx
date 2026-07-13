import { ArrowLeft, Plus, Trophy } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../data";
import type { MyCompetition } from "../hooks/useCompetition";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const CORAL       = "#E2503F";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

interface Props {
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  myCompetitions: MyCompetition[];
  loadingCompetitions: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function moduleLabel(module: "hiragana" | "vocab"): string {
  return module === "hiragana" ? "Hiragana — Reconocimiento" : "Vocabulario — Deletrear";
}

export default function CompetitionHomeView({ setView, session, authLoading, myCompetitions, loadingCompetitions }: Props) {
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

          <div className="mt-8 text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Tus retos</div>

          {loadingCompetitions && <p className="text-sm mt-3" style={{ color: TEXT_SECOND }}>Cargando…</p>}

          {!loadingCompetitions && myCompetitions.length === 0 && (
            <p className="text-sm mt-3" style={{ color: TEXT_SECOND }}>Aún no tienes retos. Crea uno para empezar.</p>
          )}

          <div className="mt-2">
            {myCompetitions.map((c) => <CompetitionRow key={c.id} competition={c} />)}
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

function CompetitionRow({ competition }: { competition: MyCompetition }) {
  const chip = statusChip(competition);
  const isHiragana = competition.quiz_config.module === "hiragana";
  return (
    <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: BORDER }}>
      <span
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-semibold"
        style={{
          backgroundColor: isHiragana ? "#EFE7FB" : "#FBE7E4",
          color: isHiragana ? PURPLE : CORAL,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {isHiragana ? "あ" : "本"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: TEXT_MAIN }}>{moduleLabel(competition.quiz_config.module)}</div>
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
    </div>
  );
}
