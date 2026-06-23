export interface PhoneticEntry {
  id: string;
  kana: string;
  spoken: string;
  written: string;
  alts: [string, string];
  phenomenon: "devoicing" | "lengthening";
  note: string;
}

export interface PhenomenonGroup {
  id: string;
  title: string;
  description: string;
}

export const PHENOMENON_GROUPS: PhenomenonGroup[] = [
  {
    id: "devoicing",
    title: "Ensordecimiento い/う",
    description: "Las vocales い y う se vuelven mudas entre ciertas consonantes.",
  },
  {
    id: "lengthening",
    title: "Alargamiento ei/ou",
    description: "ei → ee, ou → oo al hablar de forma natural.",
  },
];

export const PHONETIC_WORDS: PhoneticEntry[] = [
  // ── Ensordecimiento ────────────────────────────────────────────────────────
  {
    id:          "desu",
    kana:        "です",
    spoken:      "des",
    written:     "desu",
    alts:        ["deso", "dese"],
    phenomenon:  "devoicing",
    note:        "La U final es muda después de S.",
  },
  {
    id:          "masu",
    kana:        "ます",
    spoken:      "mas",
    written:     "masu",
    alts:        ["maso", "mase"],
    phenomenon:  "devoicing",
    note:        "La U final es muda después de S.",
  },
  {
    id:          "suki",
    kana:        "すき",
    spoken:      "ski",
    written:     "suki",
    alts:        ["skee", "sukie"],
    phenomenon:  "devoicing",
    note:        "La U de SU se pierde entre consonantes sordas.",
  },
  {
    id:          "wakarimashita",
    kana:        "わかりました",
    spoken:      "wakarimashta",
    written:     "wakarimashita",
    alts:        ["wakarimashite", "wakarimasuta"],
    phenomenon:  "devoicing",
    note:        "La I de SHI desaparece entre consonantes sordas.",
  },
  {
    id:          "takushii",
    kana:        "たくしい",
    spoken:      "takshi",
    written:     "takushii",
    alts:        ["taksii", "takushee"],
    phenomenon:  "devoicing",
    note:        "La U de KU se pierde entre K y SH.",
  },
  {
    id:          "daisuki",
    kana:        "だいすき",
    spoken:      "daiski",
    written:     "daisuki",
    alts:        ["daiksi", "daiske"],
    phenomenon:  "devoicing",
    note:        "La U de SU se pierde entre consonantes sordas.",
  },

  // ── Alargamiento ───────────────────────────────────────────────────────────
  {
    id:          "sensei",
    kana:        "せんせい",
    spoken:      "sensee",
    written:     "sensei",
    alts:        ["sensai", "senssei"],
    phenomenon:  "lengthening",
    note:        "EI se pronuncia como EE (vocal larga).",
  },
  {
    id:          "ohayou",
    kana:        "おはよう",
    spoken:      "ohayoo",
    written:     "ohayou",
    alts:        ["ohayoe", "ohayo"],
    phenomenon:  "lengthening",
    note:        "OU se pronuncia como OO (vocal larga).",
  },
  {
    id:          "arigatou",
    kana:        "ありがとう",
    spoken:      "arigatoo",
    written:     "arigatou",
    alts:        ["arigatoe", "arigato"],
    phenomenon:  "lengthening",
    note:        "OU se pronuncia como OO (vocal larga).",
  },
  {
    id:          "kirei",
    kana:        "きれい",
    spoken:      "kiree",
    written:     "kirei",
    alts:        ["kire", "kirrei"],
    phenomenon:  "lengthening",
    note:        "EI se pronuncia como EE (vocal larga).",
  },
  {
    id:          "gakusei",
    kana:        "がくせい",
    spoken:      "gaksee",
    written:     "gakusei",
    alts:        ["gakusai", "gaksai"],
    phenomenon:  "lengthening",
    note:        "La U de KU se pierde y EI → EE.",
  },
  {
    id:          "omedetou",
    kana:        "おめでとう",
    spoken:      "omedetoo",
    written:     "omedetou",
    alts:        ["omedetoe", "omedeto"],
    phenomenon:  "lengthening",
    note:        "OU se pronuncia como OO (vocal larga).",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getPhoneticChoices(entry: PhoneticEntry): string[] {
  return shuffle([entry.spoken, entry.written, entry.alts[0], entry.alts[1]]);
}

export function getAvailablePhonetics(selectedPhenomena: Set<string>): PhoneticEntry[] {
  if (selectedPhenomena.size === 0) return [];
  return PHONETIC_WORDS.filter((e) => selectedPhenomena.has(e.phenomenon));
}
