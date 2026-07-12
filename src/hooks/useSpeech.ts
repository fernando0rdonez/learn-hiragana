import { useEffect, useRef, useState } from "react";

export interface UseSpeechResult {
  // Resuelve con true si la síntesis realmente arrancó a sonar (onstart),
  // y false si no. Refleja lo que de verdad pasó, a diferencia de un
  // heurístico basado en la lista de voces (que da falsos negativos en
  // Android, donde el sistema puede hablar japonés sin exponer una voz
  // "ja-JP" explícita).
  speak: (text: string, rate?: number) => Promise<boolean>;
  isSpeaking: boolean;
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}

export function useSpeech(): UseSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;

    loadVoices().then((voices) => {
      voiceRef.current = voices.find((v) => v.lang === "ja-JP") ?? null;
    });
  }, []);

  // Resuelve cuando termina de hablar, para poder esperar antes de avanzar
  // y evitar que se corte la pronunciación a mitad de frase.
  function speak(text: string, rate = 0.8): Promise<boolean> {
    if (typeof speechSynthesis === "undefined") return Promise.resolve(false);

    speechSynthesis.cancel();

    return new Promise((resolve) => {
      let settled = false;
      let played = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        setIsSpeaking(false);
        clearTimeout(safetyTimeout);
        resolve(played);
      };

      // Red de seguridad: en algunos navegadores, tras cancel(), speak() puede
      // no disparar nunca onend/onerror (bug conocido de speechSynthesis), lo
      // que dejaría esta promesa colgada para siempre y bloquearía el avance
      // a la siguiente pregunta. Este timeout garantiza que siempre se resuelva.
      const safetyTimeout = setTimeout(settle, Math.max(3000, text.length * 300) / rate);

      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.lang = "ja-JP";
      utterance.rate = rate;

      utterance.onstart = () => {
        played = true;
        setIsSpeaking(true);
      };
      utterance.onend = settle;
      utterance.onerror = settle;

      speechSynthesis.speak(utterance);
    });
  }

  return { speak, isSpeaking };
}
