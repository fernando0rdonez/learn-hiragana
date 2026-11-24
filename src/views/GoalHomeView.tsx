import { useState, type FormEvent } from "react";
import { ArrowLeft, Plus, Target, ArrowRight, ScanLine } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../data";
import type { ScannedInvite } from "../qrInvite";
import QrScannerModal from "../components/QrScannerModal";
import type { MyGoal } from "../hooks/useGoals";
import { MAX_PLAYERS } from "../hooks/useCompetition";
import { goalDayNumber, goalEndDate } from "../goals";
import { toISODate } from "../utils";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

interface Props {
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  myGoals: MyGoal[];
  loadingGoals: boolean;
  onOpen: (goal: MyGoal) => void;
  onJoinByCode: (code: string) => void;
  /** Joins whatever the in-app QR scanner found — may be the other kind of invite. */
  onScanned: (invite: ScannedInvite) => void;
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export default function GoalHomeView({ setView, session, authLoading, myGoals, loadingGoals, onOpen, onJoinByCode, onScanned }: Props) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [code, setCode] = useState("");
  const active = myGoals.filter((g) => g.phase !== "finished");
  const finished = myGoals.filter((g) => g.phase === "finished");

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
      <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>Metas</h1>

      {!authLoading && !session && (
        <div className="rounded-3xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}>
          <Target size={28} className="mb-3 opacity-90" />
          <div className="text-lg font-bold mb-1">Inicia sesión para crear metas</div>
          <p className="text-sm opacity-90 mb-4 leading-relaxed">
            Las metas se comparten con tus amigos, así que necesitan tu cuenta.
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
            <div className="text-xs font-semibold tracking-wide uppercase opacity-80">Meta compartida · hasta {MAX_PLAYERS} personas</div>
            <div className="text-xl font-bold mt-1.5 mb-1.5">Estudien juntos cada día</div>
            <p className="text-sm opacity-90 mb-4 max-w-[260px] leading-relaxed">
              Elige qué practicar cada día y por cuánto tiempo. Todos ven quién va cumpliendo.
            </p>
            <button
              onClick={() => setView("goalCreate")}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: "#fff", color: PURPLE_DARK }}
            >
              <Plus size={15} /> Crear meta
            </button>
          </div>

          <form onSubmit={handleSubmitCode} className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_SECOND }}>¿Te pasaron un código?</div>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código de la meta"
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
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="w-full mt-2.5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border-[1.5px]"
            style={{ borderColor: PURPLE, color: PURPLE_DARK }}
          >
            <ScanLine size={16} /> Escanear QR
          </button>
          {scannerOpen && (
            <QrScannerModal
              fallbackKind="goal"
              onClose={() => setScannerOpen(false)}
              onResult={(invite) => {
                setScannerOpen(false);
                onScanned(invite);
              }}
            />
          )}

          {loadingGoals && <p className="text-sm mt-8" style={{ color: TEXT_SECOND }}>Cargando…</p>}

          {!loadingGoals && myGoals.length === 0 && (
            <p className="text-sm mt-8" style={{ color: TEXT_SECOND }}>Aún no tienes metas. Crea una e invita a tus amigos.</p>
          )}

          {active.length > 0 && (
            <>
              <div className="mt-8 text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Activas</div>
              <div className="mt-2">{active.map((g) => <GoalListRow key={g.id} goal={g} onOpen={onOpen} />)}</div>
            </>
          )}

          {finished.length > 0 && (
            <>
              <div className="mt-8 text-xs font-semibold tracking-wide uppercase" style={{ color: TEXT_SECOND }}>Terminadas</div>
              <div className="mt-2">{finished.map((g) => <GoalListRow key={g.id} goal={g} onOpen={onOpen} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function GoalListRow({ goal, onOpen }: { goal: MyGoal; onOpen: (g: MyGoal) => void }) {
  const people = `${goal.participantCount} ${goal.participantCount === 1 ? "persona" : "personas"}`;
  const progress = goal.phase === "finished"
    ? `Terminó el ${formatDate(goalEndDate(goal))}`
    : `Día ${goalDayNumber(goal, toISODate())} de ${goal.duration_days}`;
  return (
    <button
      onClick={() => onOpen(goal)}
      className="w-full flex items-center gap-3 py-3 border-b text-left"
      style={{ borderColor: BORDER, opacity: goal.phase === "finished" ? 0.7 : 1 }}
    >
      <span className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EFE7FB", color: PURPLE }}>
        <Target size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: TEXT_MAIN }}>{goal.title}</div>
        <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>{progress} · {people}</div>
      </div>
    </button>
  );
}
