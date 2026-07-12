import { useRef } from "react";
import { ArrowLeft, BarChart3, Map, Download, Upload, Trash2, ChevronRight } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { ProgressData } from "../types";
import SyncPanel from "../components/SyncPanel";
import type { ViewName } from "../data";
import foxImg from "../assets/character/fox-calm.png";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";

interface Props {
  setView: (v: ViewName) => void;
  resetConfirm: boolean;
  setResetConfirm: (v: boolean) => void;
  resetProgress: () => void;
  exportProgress: () => void;
  importError: string | null;
  pendingImport: ProgressData | null;
  importSuccess: boolean;
  stageImport: (file: File) => void;
  confirmImport: () => void;
  cancelImport: () => void;
  session: Session | null;
  authLoading: boolean;
  otpStage: "idle" | "codeSent" | "verifying";
  otpError: string | null;
  pendingEmail: string;
  cooldownSeconds: number;
  requestCode: (email: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  cancelOtp: () => void;
  signOut: () => Promise<void>;
  pushNow: () => Promise<void>;
  syncing: boolean;
}

export default function SettingsView({
  setView, resetConfirm, setResetConfirm, resetProgress, exportProgress,
  importError, pendingImport, importSuccess, stageImport, confirmImport, cancelImport,
  session, authLoading, otpStage, otpError, pendingEmail, cooldownSeconds, requestCode, verifyCode, cancelOtp, signOut, pushNow, syncing,
}: Props) {
  const importInputRef = useRef<HTMLInputElement>(null);

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) stageImport(file);
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>

      <div
        className="relative rounded-3xl pt-6 pb-9 pl-6 pr-28 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, overflow: "visible" }}
      >
        <div className="text-xs font-semibold tracking-wide uppercase opacity-80">Configuración</div>
        <h2 className="text-xl font-bold mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Tu cuenta y tus datos
        </h2>
        <p className="text-sm opacity-90 mt-1.5 leading-relaxed">
          Sincroniza entre dispositivos, exporta una copia o borra tu progreso.
        </p>
        <img
          src={foxImg}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{ width: 96, height: "auto", bottom: -18, right: 10, zIndex: 2 }}
        />
      </div>

      {/* ── Cuenta ── */}
      <SectionLabel>Cuenta</SectionLabel>
      <div className="rounded-2xl border p-4 mt-3" style={{ borderColor: BORDER }}>
        <SyncPanel
          session={session}
          authLoading={authLoading}
          otpStage={otpStage}
          otpError={otpError}
          pendingEmail={pendingEmail}
          cooldownSeconds={cooldownSeconds}
          requestCode={requestCode}
          verifyCode={verifyCode}
          cancelOtp={cancelOtp}
          signOut={signOut}
          pushNow={pushNow}
          syncing={syncing}
        />
      </div>

      {/* ── Progreso ── */}
      <SectionLabel>Progreso</SectionLabel>
      <div className="rounded-2xl border mt-3 overflow-hidden" style={{ borderColor: BORDER }}>
        <SettingsRow icon={<BarChart3 size={16} />} label="Ver estadísticas" onClick={() => setView("stats")} />
        <SettingsRow icon={<Map size={16} />} label="Camino a B1" onClick={() => setView("roadmap")} />
        <SettingsRow icon={<Upload size={16} />} label="Exportar progreso" onClick={exportProgress} />
        <SettingsRow icon={<Download size={16} />} label="Importar progreso" onClick={() => importInputRef.current?.click()} last />
      </div>
      <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFileChange} />

      {importError && (
        <p className="text-xs text-rose-600 text-center mt-3">{importError}</p>
      )}

      {pendingImport && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <button onClick={confirmImport} className="text-xs text-amber-600 font-medium">
            ¿Sobrescribir progreso actual? Confirmar importación
          </button>
          <button onClick={cancelImport} className="text-xs text-stone-400 hover:text-stone-600">
            Cancelar
          </button>
        </div>
      )}

      {importSuccess && (
        <p className="text-xs text-emerald-600 font-medium text-center mt-3">Progreso importado correctamente.</p>
      )}

      {/* ── Zona de riesgo ── */}
      <div className="flex justify-center mt-8">
        {!resetConfirm ? (
          <button onClick={() => setResetConfirm(true)} className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1">
            <Trash2 size={12} /> Borrar progreso
          </button>
        ) : (
          <button onClick={resetProgress} className="text-xs text-rose-600 font-medium">
            ¿Seguro? Confirmar borrado
          </button>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold tracking-wide uppercase mt-7" style={{ color: TEXT_SECOND }}>
      {children}
    </div>
  );
}

function SettingsRow({ icon, label, onClick, last }: { icon: React.ReactNode; label: string; onClick: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 transition-colors"
      style={{ borderBottom: last ? "none" : `1px solid ${BORDER}` }}
    >
      <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F0EAF9", color: PURPLE }}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold" style={{ color: TEXT_MAIN }}>{label}</span>
      <ChevronRight size={16} style={{ color: TEXT_SECOND }} />
    </button>
  );
}
