import { ArrowLeft, ChevronRight, Check } from "lucide-react";
import type { GrammarLesson } from "../grammar";
import { GRAMMAR_LESSONS } from "../grammar";
import type { ViewName } from "../data";
import type { ProgressItems, CharStatus } from "../types";
import { grammarStatus } from "../utils";

interface Props {
  progress: ProgressItems;
  setSelectedGrammarLessonId: (id: string) => void;
  setView: (v: ViewName) => void;
}

const INDIGO       = "#4C5FBF";
const INDIGO_DARK  = "#33408C";
const INDIGO_LIGHT = "#EDEFFB";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";

const STATUS_LABEL: Record<CharStatus, string> = {
  untested: "Nueva",
  developing: "En progreso",
  weak: "A repasar",
  mastered: "Dominada",
};

const STATUS_COLOR: Record<CharStatus, string> = {
  untested: TEXT_SECOND,
  developing: "#F5A623",
  weak: "#C03A1E",
  mastered: "#0A6E54",
};

function groupBySection(lessons: GrammarLesson[]): { section: string; lessons: GrammarLesson[] }[] {
  const sections: { section: string; lessons: GrammarLesson[] }[] = [];
  for (const lesson of lessons) {
    const last = sections[sections.length - 1];
    if (last && last.section === lesson.section) last.lessons.push(lesson);
    else sections.push({ section: lesson.section, lessons: [lesson] });
  }
  return sections;
}

export default function GrammarSetupView({ progress, setSelectedGrammarLessonId, setView }: Props) {
  const sections = groupBySection(GRAMMAR_LESSONS);
  const masteredCount = GRAMMAR_LESSONS.filter((l) => grammarStatus(progress, l.id) === "mastered").length;

  function openLesson(id: string) {
    setSelectedGrammarLessonId(id);
    setView("grammarLesson");
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Inicio
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>
        Gramática
      </h2>
      <p className="text-sm mt-1" style={{ color: TEXT_SECOND }}>
        {masteredCount} de {GRAMMAR_LESSONS.length} lecciones dominadas
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {sections.map(({ section, lessons }) => (
          <div key={section}>
            <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: TEXT_SECOND }}>
              {section}
            </div>
            <div className="flex flex-col gap-2">
              {lessons.map((lesson) => {
                const status = grammarStatus(progress, lesson.id);
                const isMastered = status === "mastered";
                return (
                  <button
                    key={lesson.id}
                    onClick={() => openLesson(lesson.id)}
                    className="w-full text-left rounded-2xl border-2 p-4 transition-colors hover:border-[#C7CDF2] hover:bg-[#FAFAFF]"
                    style={{ backgroundColor: isMastered ? INDIGO_LIGHT : "#FFFFFF", borderColor: isMastered ? INDIGO : BORDER }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>{lesson.title}</span>
                          {isMastered && <Check size={14} style={{ color: INDIGO }} />}
                        </div>
                        <div className="text-xs mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: TEXT_SECOND }}>
                          {lesson.pattern}
                        </div>
                        <div className="text-xs font-medium mt-1" style={{ color: STATUS_COLOR[status] }}>
                          {STATUS_LABEL[status]}
                        </div>
                      </div>
                      <ChevronRight size={18} className="shrink-0" style={{ color: INDIGO_DARK }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
