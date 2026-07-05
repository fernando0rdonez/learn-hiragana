import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSpeech } from "../hooks/useSpeech";
import { detectOS, type DetectedOS } from "../utils/os";

interface Props {
  text: string;
  className?: string;
  size?: number;       // button diameter in px
  iconSize?: number;
  accent?: string;     // hex used for hover border/text and the "speaking" state
  idleBorder?: string; // hex for the idle (non-hover, non-speaking) border
  idleText?: string;   // hex for the idle icon color
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const DEFAULT_ACCENT      = "#6366F1"; // indigo-500
const DEFAULT_IDLE_BORDER = "#D6D3D1"; // stone-300
const DEFAULT_IDLE_TEXT   = "#57534E"; // stone-600

function StepsPath({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-stone-700">{children}</span>;
}

const OS_HINTS: Record<DetectedOS, React.ReactNode> = {
  ios: (
    <>
      Para escuchar la pronunciación, activa la voz japonesa en Ajustes:{" "}
      <StepsPath>Ajustes → Accesibilidad → Contenido hablado → Voces → Japonés → descargar</StepsPath>
    </>
  ),
  android: (
    <>
      Para escuchar la pronunciación, instala la voz japonesa:{" "}
      <StepsPath>Ajustes → Sistema → Idiomas y entrada → Síntesis de voz → Instalar datos de voz → Japonés</StepsPath>
    </>
  ),
  macos: (
    <>
      Para escuchar la pronunciación, activa la voz japonesa:{" "}
      <StepsPath>Ajustes del Sistema → Accesibilidad → Contenido hablado → Voz del sistema → Gestionar voces… → Japonés</StepsPath>
    </>
  ),
  windows: (
    <>
      Para escuchar la pronunciación, instala la voz japonesa:{" "}
      <StepsPath>Configuración → Hora e idioma → Voz → Agregar voces → Japonés (日本語)</StepsPath>
    </>
  ),
  other: (
    <>Para escuchar la pronunciación, instala o activa una voz en japonés (ja-JP) en la configuración de idioma o accesibilidad de tu sistema o navegador.</>
  ),
};

export function AudioUnavailableHint({ className = "" }: { className?: string }) {
  const [os] = useState(detectOS);
  return (
    <p className={`text-xs text-stone-500 text-center max-w-[240px] leading-relaxed ${className}`}>
      {OS_HINTS[os]}
    </p>
  );
}

export default function AudioButton({
  text,
  className = "",
  size = 44,
  iconSize = 20,
  accent = DEFAULT_ACCENT,
  idleBorder = DEFAULT_IDLE_BORDER,
  idleText = DEFAULT_IDLE_TEXT,
}: Props) {
  const { speak, isSpeaking, isAvailable } = useSpeech();
  const [showHelp, setShowHelp] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    if (!isAvailable) {
      setShowHelp((prev) => !prev);
      return;
    }
    speak(text);
  }

  const style: React.CSSProperties = !isAvailable
    ? { width: size, height: size, borderColor: "#E7E5E4", backgroundColor: "#FAFAF9", color: "#D6D3D1" }
    : isSpeaking
    ? { width: size, height: size, borderColor: accent, backgroundColor: hexToRgba(accent, 0.12), color: accent, transform: "scale(1.1)" }
    : hovered
    ? { width: size, height: size, borderColor: accent, backgroundColor: "#FFFFFF", color: accent }
    : { width: size, height: size, borderColor: idleBorder, backgroundColor: "#FFFFFF", color: idleText };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={isAvailable ? "Escuchar pronunciación" : "Voz japonesa no disponible"}
        className="flex items-center justify-center rounded-full border-2 transition-all select-none"
        style={style}
      >
        <span className={`leading-none ${isSpeaking ? "animate-pulse" : ""}`}>
          {isAvailable ? <Volume2 size={iconSize} /> : <VolumeX size={iconSize} />}
        </span>
      </button>

      {!isAvailable && showHelp && <AudioUnavailableHint />}
    </div>
  );
}
