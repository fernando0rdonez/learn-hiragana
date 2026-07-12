import type { ProgressItems } from "../../types";
import type { GrammarLesson } from "../../grammar";
import type { ViewName } from "../../data";
import GrammarSetupView from "../GrammarSetupView";
import GrammarLessonGame from "../../components/GrammarLessonGame";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  setSelectedGrammarLessonId: (id: string | null) => void;
  selectedGrammarLesson: GrammarLesson | null;
}

export default function GrammarModuleViews({
  view, setView, progress, onProgressUpdate, setSelectedGrammarLessonId, selectedGrammarLesson,
}: Props) {
  return (
    <>
      {view === "grammarSetup" && (
        <GrammarSetupView
          progress={progress}
          setSelectedGrammarLessonId={setSelectedGrammarLessonId}
          setView={setView}
        />
      )}

      {view === "grammarLesson" && selectedGrammarLesson && (
        <GrammarLessonGame
          lesson={selectedGrammarLesson}
          progress={progress}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("grammarSetup")}
        />
      )}
    </>
  );
}
