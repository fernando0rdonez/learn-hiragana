import { useEffect, useRef, useState } from "react";

export interface UseSpeechResult {
  speak: (text: string) => void;
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

  function speak(text: string) {
    if (!voiceRef.current || typeof speechSynthesis === "undefined") return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceRef.current;
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }

  return { speak, isSpeaking, isAvailable };
}
