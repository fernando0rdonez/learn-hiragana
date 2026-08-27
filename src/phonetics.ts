export interface PhoneticEntry {
  id: string;
  kana: string;
  spoken: string;
  written: string;
  alts: [string, string];
  phenomenon: "devoicing" | "lengthening" | "pitch";
  note: string;
  /** Solo en pares de tono: el sentido concreto que se pregunta (p. ej. "雨 · lluvia"). */
  meaning?: string;
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
  {
    id: "pitch",
    title: "Tonos altos y bajos",
    description: "Palabras que se escriben igual cambian de significado según en qué sílaba sube la voz.",
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

  // ── Tonos altos y bajos (acento de altura) ─────────────────────────────────
  {
    id:          "ame-lluvia",
    kana:        "あめ",
    meaning:     "雨 · lluvia",
    spoken:      "áme",
    written:     "amé",
    alts:        ["ame", "amèe"],
    phenomenon:  "pitch",
    note:        "雨 (lluvia) lleva el tono alto en la 1.ª sílaba: Áme. 飴 (caramelo) lo lleva en la última: amÉ.",
  },
  {
    id:          "ame-caramelo",
    kana:        "あめ",
    meaning:     "飴 · caramelo",
    spoken:      "amé",
    written:     "áme",
    alts:        ["ame", "àme"],
    phenomenon:  "pitch",
    note:        "飴 (caramelo) sube el tono en la última sílaba: amÉ. 雨 (lluvia) lo lleva en la primera: Áme.",
  },
  {
    id:          "kami-dios",
    kana:        "かみ",
    meaning:     "神 · dios",
    spoken:      "kámi",
    written:     "kamí",
    alts:        ["kami", "kàmi"],
    phenomenon:  "pitch",
    note:        "神 (dios) lleva el tono alto en KA: KÁmi. 紙 (papel) lo lleva en MI: kaMÍ.",
  },
  {
    id:          "kami-papel",
    kana:        "かみ",
    meaning:     "紙 · papel",
    spoken:      "kamí",
    written:     "kámi",
    alts:        ["kami", "kàmi"],
    phenomenon:  "pitch",
    note:        "紙 (papel) sube el tono en MI: kaMÍ. 神 (dios) lo lleva en KA: KÁmi.",
  },
  {
    id:          "sake-salmon",
    kana:        "さけ",
    meaning:     "鮭 · salmón",
    spoken:      "sáke",
    written:     "saké",
    alts:        ["sake", "sàke"],
    phenomenon:  "pitch",
    note:        "鮭 (salmón) lleva el tono alto en SA: SÁke. 酒 (alcohol) lo lleva en KE: saKÉ.",
  },
  {
    id:          "sake-alcohol",
    kana:        "さけ",
    meaning:     "酒 · alcohol",
    spoken:      "saké",
    written:     "sáke",
    alts:        ["sake", "sàke"],
    phenomenon:  "pitch",
    note:        "酒 (alcohol) sube el tono en KE: saKÉ. 鮭 (salmón) lo lleva en SA: SÁke.",
  },
  {
    id:          "hashi-palillos",
    kana:        "はし",
    meaning:     "箸 · palillos",
    spoken:      "háshi",
    written:     "hashí",
    alts:        ["hashi", "hàshi"],
    phenomenon:  "pitch",
    note:        "箸 (palillos) lleva el tono alto en HA: HÁshi. 橋 (puente) lo lleva en SHI: haSHÍ.",
  },
  {
    id:          "hashi-puente",
    kana:        "はし",
    meaning:     "橋 · puente",
    spoken:      "hashí",
    written:     "háshi",
    alts:        ["hashi", "hàshi"],
    phenomenon:  "pitch",
    note:        "橋 (puente) sube el tono en SHI: haSHÍ. 箸 (palillos) lo lleva en HA: HÁshi.",
  },
  {
    id:          "hana-flor",
    kana:        "はな",
    meaning:     "花 · flor",
    spoken:      "haná",
    written:     "hána",
    alts:        ["hana", "hànà"],
    phenomenon:  "pitch",
    note:        "花 (flor) mantiene el tono hasta el final: haNÁ. 鼻 (nariz) baja tras HA: HÁna.",
  },
  {
    id:          "hana-nariz",
    kana:        "はな",
    meaning:     "鼻 · nariz",
    spoken:      "hána",
    written:     "haná",
    alts:        ["hana", "hànà"],
    phenomenon:  "pitch",
    note:        "鼻 (nariz) lleva el tono alto en HA: HÁna. 花 (flor) lo lleva en NA: haNÁ.",
  },
  {
    id:          "shiro-blanco",
    kana:        "しろ",
    meaning:     "白 · blanco",
    spoken:      "shíro",
    written:     "shiró",
    alts:        ["shiro", "shìro"],
    phenomenon:  "pitch",
    note:        "白 (blanco) lleva el tono alto en SHI: SHÍro. 城 (castillo) lo lleva en RO: shiRÓ.",
  },
  {
    id:          "shiro-castillo",
    kana:        "しろ",
    meaning:     "城 · castillo",
    spoken:      "shiró",
    written:     "shíro",
    alts:        ["shiro", "shìro"],
    phenomenon:  "pitch",
    note:        "城 (castillo) sube el tono en RO: shiRÓ. 白 (blanco) lo lleva en SHI: SHÍro.",
  },
  {
    id:          "soudesuka-afirmacion",
    kana:        "そうですか",
    meaning:     "afirmación · «ya veo»",
    spoken:      "sōdesuka",
    written:     "sōdesuká",
    alts:        ["sódesuka", "soudesuka"],
    phenomenon:  "pitch",
    note:        "Como afirmación («ya veo»), la voz BAJA en か: sōdesuka. Como pregunta («¿de veras?»), SUBE en か: sōdesuká.",
  },
  {
    id:          "soudesuka-pregunta",
    kana:        "そうですか",
    meaning:     "pregunta · «¿de veras?»",
    spoken:      "sōdesuká",
    written:     "sōdesuka",
    alts:        ["sódesuka", "soudesuka"],
    phenomenon:  "pitch",
    note:        "Como pregunta («¿de veras?»), la voz SUBE en か: sōdesuká. Como afirmación («ya veo»), BAJA en か: sōdesuka.",
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
