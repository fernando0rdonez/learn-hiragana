import { useState } from "react";
import { useSpeech } from "../hooks/useSpeech";

interface Props {
  text: string;
  className?: string;
}

export default function AudioButton({ text, className = "" }: Props) {
  const { speak, isSpeaking, isAvailable } = useSpeech();
  const [showHelp, setShowHelp] = useState(false);

  function handleClick() {
    if (!isAvailable) {
      setShowHelp((prev) => !prev);
      return;
    }
    speak(text);
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <button
        onClick={handleClick}
        aria-label={isAvailable ? "Escuchar pronunciación" : "Voz japonesa no disponible"}
        className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all select-none
          ${isAvailable
            ? isSpeaking
              ? "border-indigo-500 bg-indigo-100 text-indigo-700 scale-110"
              : "border-stone-300 bg-white text-stone-600 hover:border-indigo-400 hover:text-indigo-600"
            : "border-stone-200 bg-stone-50 text-stone-300 cursor-pointer"
          }
        `}
      >
        <span className={`text-xl leading-none ${isSpeaking ? "animate-pulse" : ""}`}>
          {isAvailable ? "🔊" : "🔇"}
        </span>
      </button>

      {!isAvailable && showHelp && (
        <p className="text-xs text-stone-500 text-center max-w-[240px] leading-relaxed">
          Para escuchar la pronunciación, activa la voz japonesa en tu iPhone:{" "}
          <span className="font-medium text-stone-700">
            Configuración → Accesibilidad → Contenido hablado → Voces → Japonés → descargar
          </span>
        </p>
      )}
    </div>
  );
}
