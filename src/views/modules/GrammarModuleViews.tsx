import type { ProgressItems } from "../../types";
import type { GrammarLesson } from "../../grammar";
import type { ViewName } from "../../data";
import type { StudyEvent } from "../../goals";
import GrammarSetupView from "../GrammarSetupView";
import GrammarLessonGame from "../../components/GrammarLessonGame";
import ParticleOrderGame from "../../components/ParticleOrderGame";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  setSelectedGrammarLessonId: (id: string | null) => void;
  selectedGrammarLesson: GrammarLesson | null;
  onStudyEvent: (event: StudyEvent) => void;
}

export default function GrammarModuleViews({
  view, setView, progress, onProgressUpdate, setSelectedGrammarLessonId, selectedGrammarLesson, onStudyEvent,
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
          onComplete={() => onStudyEvent({
            module: "grammar",
            lessonId: selectedGrammarLesson.id,
            book: selectedGrammarLesson.section,
          })}
        />
      )}

      {view === "grammarTrain" && (
        <ParticleOrderGame
          onBack={() => setView("grammarSetup")}
          onComplete={() => onStudyEvent({ module: "grammarTrain" })}
        />
      )}
    </>
  );
}
