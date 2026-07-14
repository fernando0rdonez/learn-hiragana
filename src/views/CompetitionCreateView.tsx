import { useState } from "react";
import { ArrowLeft, Share2, Copy, Check } from "lucide-react";
import type { ViewName } from "../data";
import type { CompetitionModuleId, CompetitionMode, CompetitionRow, CompetitionSize } from "../hooks/useCompetition";
import type { DateTimeCompetitionMode } from "../dateTime";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const CORAL       = "#E2503F";
const SLATE_DARK  = "#334155";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

interface Props {
  setView: (v: ViewName) => void;
  createCompetition: (module: CompetitionModuleId, size: CompetitionSize, mode?: CompetitionMode) => Promise<CompetitionRow | null>;
}

const DATETIME_MODE_LABELS: Record<DateTimeCompetitionMode, string> = {
  recognize: "Reconocer",
  write: "Escribir",
  build: "Construir",
  clock: "Reloj",
};

function inviteUrl(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}compete/${code}`;
}

export default function CompetitionCreateView({ setView, createCompetition }: Props) {
  const [module, setModule] = useState<CompetitionModuleId>("hiragana");
  const [dateTimeMode, setDateTimeMode] = useState<DateTimeCompetitionMode>("recognize");
  const [size, setSize] = useState<CompetitionSize>(10);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CompetitionRow | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setCreating(true);
    const mode: CompetitionMode = module === "hiragana" ? "recognition" : module === "vocab" ? "spell" : dateTimeMode;
    const row = await createCompetition(module, size, mode);
    setCreating(false);
    if (row) setCreated(row);
  }

  async function handleShare(url: string) {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "かな道 — Reto" });
      } catch {
        // el usuario canceló el share sheet — no es un error a mostrar
      }
    } else {
      await handleCopy(url);
    }
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (created) {
    const url = inviteUrl(created.invite_code);
    return (
      <div className="pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView("competeHome")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
            <ArrowLeft size={14} /> Competir
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>Reto creado</h1>
        <p className="text-sm mb-6" style={{ color: TEXT_SECOND }}>Comparte este link con quien quieras retar.</p>

        <div className="rounded-2xl p-4" style={{ backgroundColor: "#F9F8FC", border: `1.5px dashed ${BORDER}` }}>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: TEXT_SECOND }}>Link de invitación</div>
          <div className="text-sm font-semibold rounded-xl px-3 py-2.5 mb-3 break-all bg-white border" style={{ color: PURPLE_DARK, borderColor: BORDER }}>
            {url}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleShare(url)}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl py-2.5 text-white"
              style={{ backgroundColor: PURPLE }}
            >
              <Share2 size={15} /> Compartir
            </button>
            <button
              onClick={() => void handleCopy(url)}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl py-2.5 border"
              style={{ color: TEXT_MAIN, borderColor: BORDER }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: TEXT_SECOND }}>
          Expira en 48 horas. Hasta 6 personas pueden unirse con este link.
        </p>

        <button
          onClick={() => setView("competeHome")}
          className="w-full mt-6 rounded-2xl py-3.5 text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("competeHome")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Competir
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>Crear reto</h1>

      <div className="text-[11px] font-bold uppercase tracking-wide mb-2.5" style={{ color: TEXT_SECOND }}>Módulo</div>
      <ModuleCard
        selected={module === "hiragana"}
        accent={PURPLE}
        accentBg="#EFE7FB"
        glyph="あ"
        glyphFont="'Noto Sans JP', sans-serif"
        title="Hiragana — Reconocimiento"
        subtitle="Ves el kana, escribes el romaji"
        onClick={() => setModule("hiragana")}
      />
      <ModuleCard
        selected={module === "vocab"}
        accent={CORAL}
        accentBg="#FBE7E4"
        glyph="📖"
        title="Vocabulario — Deletrear"
        subtitle="Ves la imagen, formas la palabra"
        onClick={() => setModule("vocab")}
      />
      <ModuleCard
        selected={module === "datetime"}
        accent={SLATE_DARK}
        accentBg="#F1F5F9"
        glyph="🕐"
        title="Hora"
        subtitle="Reconocer, escribir o construir la hora"
        onClick={() => setModule("datetime")}
      />

      {module === "datetime" && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wide mt-6 mb-2.5" style={{ color: TEXT_SECOND }}>Modo</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(DATETIME_MODE_LABELS) as DateTimeCompetitionMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setDateTimeMode(m)}
                className="text-center rounded-xl py-2.5 text-sm font-bold border-[1.5px]"
                style={dateTimeMode === m
                  ? { borderColor: SLATE_DARK, backgroundColor: "#F1F5F9", color: SLATE_DARK }
                  : { borderColor: BORDER, color: TEXT_SECOND }}
              >
                {DATETIME_MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="text-[11px] font-bold uppercase tracking-wide mt-6 mb-2.5" style={{ color: TEXT_SECOND }}>Cantidad de ítems</div>
      <div className="flex gap-2">
        {([10, 20] as const).map((n) => (
          <button
            key={n}
            onClick={() => setSize(n)}
            className="flex-1 text-center rounded-xl py-2.5 text-sm font-bold border-[1.5px]"
            style={size === n ? { borderColor: PURPLE, backgroundColor: "#F7F3FD", color: PURPLE } : { borderColor: BORDER, color: TEXT_SECOND }}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs mt-2 mb-6 leading-relaxed" style={{ color: TEXT_SECOND }}>
        {size} {module === "hiragana" ? "kana" : module === "vocab" ? "palabras" : "horas"} al azar. Todos los que se unan jugarán exactamente el mismo set.
      </p>

      <button
        onClick={() => void handleCreate()}
        disabled={creating}
        className="w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        {creating ? "Creando…" : "Crear reto"}
      </button>
    </div>
  );
}

interface ModuleCardProps {
  selected: boolean;
  accent: string;
  accentBg: string;
  glyph: string;
  glyphFont?: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function ModuleCard({ selected, accent, accentBg, glyph, glyphFont, title, subtitle, onClick }: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl p-3.5 mb-2.5 border-2 text-left"
      style={{ borderColor: selected ? accent : BORDER, backgroundColor: selected ? accentBg : "#fff" }}
    >
      <span
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ backgroundColor: accentBg, color: accent, fontFamily: glyphFont }}
      >
        {glyph}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold" style={{ color: TEXT_MAIN }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>{subtitle}</div>
      </div>
      <span
        className="shrink-0 w-5 h-5 rounded-full border-2"
        style={{ borderColor: selected ? accent : BORDER, backgroundColor: selected ? accent : "transparent" }}
      />
    </button>
  );
}
