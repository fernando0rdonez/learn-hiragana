import { useState } from "react";
import { RefreshCw, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../lib/supabase";

interface Props {
  session: Session | null;
  authLoading: boolean;
  otpStage: "idle" | "codeSent" | "verifying";
  otpError: string | null;
  pendingEmail: string;
  requestCode: (email: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  cancelOtp: () => void;
  signOut: () => Promise<void>;
  pushNow: () => Promise<void>;
  syncing: boolean;
}

export default function SyncPanel({
  session, authLoading, otpStage, otpError, pendingEmail,
  requestCode, verifyCode, cancelOtp, signOut, pushNow, syncing,
}: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [justSynced, setJustSynced] = useState(false);

  if (!isSupabaseConfigured || authLoading) return null;

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{session.user.email}</span>
          <button
            onClick={async () => { await pushNow(); setJustSynced(true); setTimeout(() => setJustSynced(false), 2000); }}
            disabled={syncing}
            className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors disabled:opacity-50"
            style={{ color: "#1A1A2E" }}
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} /> Sincronizar ahora
          </button>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
            style={{ color: "#1A1A2E" }}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
        {justSynced && <p className="text-xs text-emerald-600 font-medium">Progreso sincronizado.</p>}
      </div>
    );
  }

  if (otpStage === "codeSent" || otpStage === "verifying") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-stone-400">Código enviado a {pendingEmail}</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de 6 dígitos"
            className="text-sm px-4 py-2.5 rounded-full border border-stone-200 focus:outline-none focus:border-stone-400 w-44"
          />
          <button
            onClick={() => void verifyCode(code)}
            disabled={otpStage === "verifying" || code.length === 0}
            className="text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors disabled:opacity-50"
            style={{ color: "#1A1A2E" }}
          >
            Verificar
          </button>
          <button onClick={cancelOtp} className="text-xs text-stone-400 hover:text-stone-600">
            Cancelar
          </button>
        </div>
        {otpError && <p className="text-xs text-rose-600">{otpError}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="text-sm px-4 py-2.5 rounded-full border border-stone-200 focus:outline-none focus:border-stone-400 w-52"
        />
        <button
          onClick={() => void requestCode(email)}
          disabled={email.length === 0}
          className="text-sm font-medium px-5 py-2.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition-colors disabled:opacity-50"
          style={{ color: "#1A1A2E" }}
        >
          Sincronizar entre dispositivos
        </button>
      </div>
      {otpError && <p className="text-xs text-rose-600">{otpError}</p>}
    </div>
  );
}
