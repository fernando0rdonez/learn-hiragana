import { useState } from "react";
import { ArrowLeft, Share2, Copy, Check, Play } from "lucide-react";
import type { ViewName } from "../data";
import type { MyCompetition } from "../hooks/useCompetition";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

interface Props {
  setView: (v: ViewName) => void;
  competition: MyCompetition;
  onPlay: () => void;
}

function inviteUrl(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}compete/${code}`;
}

function moduleLabel(module: "hiragana" | "vocab"): string {
  return module === "hiragana" ? "Hiragana — Reconocimiento" : "Vocabulario — Deletrear";
}

export default function CompetitionShareView({ setView, competition, onPlay }: Props) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(competition.invite_code);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "かな道 — Reto" });
      } catch {
        // el usuario canceló el share sheet — no es un error a mostrar
      }
    } else {
      await handleCopy();
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("competeHome")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Competir
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>{moduleLabel(competition.quiz_config.module)}</h1>
      <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>
        {competition.quiz_config.items.length} ítems · {competition.participantCount} jugador{competition.participantCount === 1 ? "" : "es"}
      </p>

      <div className="rounded-2xl p-4" style={{ backgroundColor: "#F9F8FC", border: `1.5px dashed ${BORDER}` }}>
        <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_SECOND }}>Código del reto</div>
        <div className="text-lg font-extrabold tracking-widest rounded-xl px-3 py-2.5 mb-3 bg-white border text-center" style={{ color: PURPLE_DARK, borderColor: BORDER }}>
          {competition.invite_code}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_SECOND }}>Link de invitación</div>
        <div className="text-sm font-semibold rounded-xl px-3 py-2.5 mb-3 break-all bg-white border" style={{ color: PURPLE_DARK, borderColor: BORDER }}>
          {url}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void handleShare()}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl py-2.5 text-white"
            style={{ backgroundColor: PURPLE }}
          >
            <Share2 size={15} /> Compartir
          </button>
          <button
            onClick={() => void handleCopy()}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl py-2.5 border"
            style={{ color: TEXT_MAIN, borderColor: BORDER }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: TEXT_SECOND }}>
        Hasta 6 personas pueden unirse con el código o el link.
      </p>

      <button
        onClick={onPlay}
        className="w-full mt-6 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        <Play size={15} /> Jugar
      </button>
    </div>
  );
}
