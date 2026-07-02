import { ArrowLeft, Play } from "lucide-react";
import type { PhoneticEntry } from "../phonetics";
import type { ViewName } from "../data";
import { PHENOMENON_GROUPS } from "../phonetics";

interface Props {
  selectedPhenomena: Set<string>;
  togglePhenomenon: (id: string) => void;
  phoneticPool: PhoneticEntry[];
  setView: (v: ViewName) => void;
}

export default function PhoneticSetupView({ selectedPhenomena, togglePhenomenon, phoneticPool, setView }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
        🎤 Fonética
      </h2>
      <p className="text-stone-500 text-sm mt-1">Practica cómo suenan realmente las palabras japonesas.</p>
      <div className="flex flex-col gap-2 mt-5">
        {PHENOMENON_GROUPS.map((pg) => {
          const sel = selectedPhenomena.has(pg.id);
          return (
            <button
              key={pg.id}
              onClick={() => togglePhenomenon(pg.id)}
              className={`text-left rounded-xl border-2 p-3 transition-colors ${sel ? "border-indigo-700 bg-indigo-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
            >
              <div className="text-sm font-medium text-stone-700">{pg.title}</div>
              <div className="text-xs text-stone-400 mt-0.5">{pg.description}</div>
            </button>
          );
        })}
      </div>
      <button
        disabled={phoneticPool.length === 0}
        onClick={() => setView("phonetics")}
        className="w-full mt-4 py-3 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Play size={18} /> Comenzar sesión
        {phoneticPool.length > 0 && ` (${phoneticPool.length})`}
      </button>
    </div>
  );
}
