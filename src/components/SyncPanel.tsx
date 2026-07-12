import { useEffect, useState } from "react";
import { RefreshCw, LogOut, X, Mail } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../lib/supabase";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";

interface Props {
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

export default function SyncPanel({
  session, authLoading, otpStage, otpError, pendingEmail, cooldownSeconds,
  requestCode, verifyCode, cancelOtp, signOut, pushNow, syncing,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // La sesión se confirma mientras el modal está abierto → ciérralo solo.
  useEffect(() => {
    if (session) setModalOpen(false);
  }, [session]);

  if (!isSupabaseConfigured || authLoading) return null;

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="text-xs text-stone-400 truncate max-w-full">{session.user.email}</span>
          <button
            onClick={async () => { await pushNow(); setJustSynced(true); setTimeout(() => setJustSynced(false), 2000); }}
            disabled={syncing}
            className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors disabled:opacity-50"
            style={{ color: TEXT_MAIN }}
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} /> Sincronizar ahora
          </button>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
            style={{ color: TEXT_MAIN }}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
        {justSynced && <p className="text-xs text-emerald-600 font-medium">Progreso sincronizado.</p>}
      </div>
    );
  }

  function closeModal() {
    cancelOtp();
    setModalOpen(false);
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
        style={{ color: TEXT_MAIN }}
      >
        <Mail size={15} /> Sincronizar entre dispositivos
      </button>

      {modalOpen && (
        <LoginModal
          otpStage={otpStage}
          otpError={otpError}
          pendingEmail={pendingEmail}
          cooldownSeconds={cooldownSeconds}
          requestCode={requestCode}
          verifyCode={verifyCode}
          cancelOtp={cancelOtp}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// ── Modal de login ──────────────────────────────────────────────────────────

interface LoginModalProps {
  otpStage: "idle" | "codeSent" | "verifying";
  otpError: string | null;
  pendingEmail: string;
  cooldownSeconds: number;
  requestCode: (email: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  cancelOtp: () => void;
  onClose: () => void;
}

function LoginModal({ otpStage, otpError, pendingEmail, cooldownSeconds, requestCode, verifyCode, cancelOtp, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const codeStep = otpStage === "codeSent" || otpStage === "verifying";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(26,26,46,0.45)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white shadow-xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-modal-title"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-colors"
        >
          <X size={15} />
        </button>

        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
        >
          <Mail size={20} className="text-white" />
        </div>

        <h3 id="sync-modal-title" className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
          {codeStep ? "Ingresa tu código" : "Sincronizar entre dispositivos"}
        </h3>

        {!codeStep && (
          <>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: TEXT_SECOND }}>
              Te enviamos un código de acceso por correo. Úsalo para llevar tu progreso a otro dispositivo.
            </p>
            <form
              className="flex flex-col gap-3 mt-5"
              onSubmit={(e) => { e.preventDefault(); if (cooldownSeconds === 0) void requestCode(email); }}
            >
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="text-sm px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:border-stone-400 w-full"
              />
              <button
                type="submit"
                disabled={email.length === 0 || cooldownSeconds > 0}
                className="text-sm font-semibold px-5 py-3 rounded-2xl text-white transition-opacity disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
              >
                {cooldownSeconds > 0 ? `Puedes pedir otro código en ${cooldownSeconds}s` : "Enviar código"}
              </button>
            </form>
            {otpError && <p className="text-xs text-rose-600 mt-3">{otpError}</p>}
          </>
        )}

        {codeStep && (
          <>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: TEXT_SECOND }}>
              Enviamos un código de 6 dígitos a <span style={{ color: TEXT_MAIN, fontWeight: 600 }}>{pendingEmail}</span>.
            </p>
            <form
              className="flex flex-col gap-3 mt-5"
              onSubmit={(e) => { e.preventDefault(); void verifyCode(code); }}
            >
              <input
                type="text"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código de 6 dígitos"
                className="text-lg tracking-[0.3em] text-center px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:border-stone-400 w-full"
              />
              <button
                type="submit"
                disabled={otpStage === "verifying" || code.length === 0}
                className="text-sm font-semibold px-5 py-3 rounded-2xl text-white transition-opacity disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
              >
                {otpStage === "verifying" ? "Verificando…" : "Verificar"}
              </button>
              <button type="button" onClick={cancelOtp} className="text-xs text-stone-400 hover:text-stone-600">
                Usar otro correo
              </button>
            </form>
            {otpError && <p className="text-xs text-rose-600 mt-3">{otpError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
