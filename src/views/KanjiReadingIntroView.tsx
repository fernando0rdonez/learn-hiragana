import { ArrowLeft } from "lucide-react";
import type { ViewName } from "../data";
import type { KanjiGroup } from "../kanji";
import { KANJI } from "../kanji";
import { foxCalmImg } from "../mascot";

const CRIMSON       = "#B3261E";
const CRIMSON_DARK  = "#8C1D17";
const TEXT_MAIN     = "#1A1A2E";
const TEXT_SECOND   = "#8B7FA8";
const BORDER        = "#EEEEEE";

interface Props {
  groups: KanjiGroup[];
  setView: (v: ViewName) => void;
}

/** Explica un concepto del grupo (p.ej. el conteo con つ) antes de la primera sesión
 *  de Lectura — mismo rol que el preview de kana nuevos en hiragana/katakana. */
export default function KanjiReadingIntroView({ groups, setView }: Props) {
  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setView("kanjiSetup")}
          className="flex items-center gap-1 text-sm hover:opacity-70"
          style={{ color: TEXT_SECOND }}
        >
          <ArrowLeft size={14} /> Volver
        </button>
      </div>

      <div
        className="relative rounded-2xl px-5 pt-4 text-white"
        style={{ background: `linear-gradient(135deg, ${CRIMSON}, ${CRIMSON_DARK})`, overflow: "visible", paddingBottom: 80 }}
      >
        <div className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Antes de empezar</div>
        <div className="mt-1 pr-16 text-lg font-bold">Modo Lectura</div>
        <img
          src={foxCalmImg}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{ width: 95, height: 95, bottom: -28, right: 10, objectFit: "contain" }}
        />
      </div>

      <div className="flex-1 overflow-y-auto mt-6 pb-4">
        {groups.map((group) => (
          <div key={group.id} className="mb-6">
            <h3 className="text-base font-bold" style={{ color: TEXT_MAIN }}>{group.readingIntro!.title}</h3>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: TEXT_SECOND }}>{group.readingIntro!.body}</p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {KANJI.filter((k) => k.group === group.id).map((k) => {
                // Solo se ilustra con ejemplos que de verdad usan la serie con つ
                // (p.ej. 一 solo tiene 一番/いちばん entre sus ejemplos, así que no aplica).
                const example = k.examples.find((e) => e.kana.includes("つ") || e.kana === "とお");
                if (!example) return null;
                return (
                  <div key={k.kanji} className="rounded-2xl border-2 px-3 py-2.5 text-center" style={{ borderColor: BORDER }}>
                    <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: "1.5rem", color: TEXT_MAIN }}>
                      {example.word}
                    </div>
                    <div className="text-xs mt-1" style={{ color: CRIMSON_DARK }}>
                      {example.kana} · {example.meaning}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white pt-2">
        <p className="text-center" style={{ color: "#BBBBBB", fontSize: 11 }}>Tenlo en cuenta al elegir la lectura correcta</p>
        <button
          onClick={() => setView("kanjiReading")}
          className="w-full mt-2 py-3.5 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: CRIMSON }}
        >
          Entendido, empezar
        </button>
      </div>
    </div>
  );
}
