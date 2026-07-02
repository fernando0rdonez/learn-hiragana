import { ArrowLeft, Play } from "lucide-react";
import type { VocabWord } from "../vocabulary";
import type { ViewName } from "../data";
import { VOCABULARY, VOCAB_CATEGORIES } from "../vocabulary";
import { getVocabImageUrl } from "../vocabImages";

interface Props {
  selectedVocabCategory: string | null;
  setSelectedVocabCategory: (id: string | null) => void;
  vocabSessionLimit: 20 | 50 | "all";
  setVocabSessionLimit: (n: 20 | 50 | "all") => void;
  filteredVocabulary: VocabWord[];
  setView: (v: ViewName) => void;
}

export default function VocabSetupView({
  selectedVocabCategory, setSelectedVocabCategory,
  vocabSessionLimit, setVocabSessionLimit,
  filteredVocabulary, setView,
}: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
        🎴 Vocabulario
      </h2>

      {/* Category picker */}
      <div className="mt-5">
        <span className="text-sm font-medium text-stone-600">Categoría</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => setSelectedVocabCategory(null)}
            className={`text-left rounded-xl border-2 p-3 transition-colors ${
              selectedVocabCategory === null
                ? "border-indigo-700 bg-indigo-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <div className="text-2xl">🌐</div>
            <div className="text-sm font-medium text-stone-700 mt-1">Todas</div>
            <div className="text-xs text-stone-400">{VOCABULARY.length} palabras</div>
          </button>
          {VOCAB_CATEGORIES.map((cat) => {
            const count = VOCABULARY.filter((w) => w.category === cat.id).length;
            const selected = selectedVocabCategory === cat.id;
            const imageUrl = cat.image ? getVocabImageUrl(cat.image) : undefined;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedVocabCategory(cat.id)}
                className={`text-left rounded-xl border-2 p-3 transition-colors ${
                  selected
                    ? "border-indigo-700 bg-indigo-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={cat.label} className="w-9 h-9 rounded-lg object-cover" />
                ) : (
                  <div className="text-2xl">{cat.emoji}</div>
                )}
                <div className="text-sm font-medium text-stone-700 mt-1">{cat.label}</div>
                <div className="text-xs text-stone-400">{count} palabras</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session length */}
      <div className="mt-6">
        <span className="text-sm font-medium text-stone-600">Palabras por sesión</span>
        <div className="flex gap-2 mt-2">
          {([20, 50] as const).map((n) => {
            const max = filteredVocabulary.length;
            return (
              <button
                key={n}
                disabled={max < n}
                onClick={() => setVocabSessionLimit(n)}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                  vocabSessionLimit === n
                    ? "border-indigo-700 bg-indigo-50 text-indigo-700"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                {n}
              </button>
            );
          })}
          <button
            onClick={() => setVocabSessionLimit("all")}
            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              vocabSessionLimit === "all"
                ? "border-indigo-700 bg-indigo-50 text-indigo-700"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            }`}
          >
            Todas ({filteredVocabulary.length})
          </button>
        </div>
      </div>

      <button
        disabled={filteredVocabulary.length === 0}
        onClick={() => setView("spellIt")}
        className="w-full mt-4 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Play size={18} /> Comenzar vocabulario
      </button>
    </div>
  );
}
