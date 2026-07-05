import { useEffect, useRef, useState } from "react";

export interface UseSpeechResult {
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
  isAvailable: boolean;
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}

export function useSpeech(): UseSpeechResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;

    loadVoices().then((voices) => {
      const jaVoice = voices.find((v) => v.lang === "ja-JP") ?? null;
      voiceRef.current = jaVoice;
      setIsAvailable(jaVoice !== null);
    });
  }, []);

  // Resuelve cuando termina de hablar, para poder esperar antes de avanzar
  // y evitar que se corte la pronunciación a mitad de frase.
  function speak(text: string): Promise<void> {
    if (typeof speechSynthesis === "undefined") return Promise.resolve();

    speechSynthesis.cancel();

    return new Promise((resolve) => {
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        setIsSpeaking(false);
        clearTimeout(safetyTimeout);
        resolve();
      };

      // Red de seguridad: en algunos navegadores, tras cancel(), speak() puede
      // no disparar nunca onend/onerror (bug conocido de speechSynthesis), lo
      // que dejaría esta promesa colgada para siempre y bloquearía el avance
      // a la siguiente pregunta. Este timeout garantiza que siempre se resuelva.
      const safetyTimeout = setTimeout(settle, Math.max(3000, text.length * 300));

      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.lang = "ja-JP";
      utterance.rate = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = settle;
      utterance.onerror = settle;

      speechSynthesis.speak(utterance);
    });
  }

  return { speak, isSpeaking, isAvailable };
}
