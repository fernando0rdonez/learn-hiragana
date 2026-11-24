import type { ProgressItems, VocabSessionLength } from "../../types";
import type { VocabWord } from "../../vocabulary";
import type { ViewName } from "../../data";
import VocabSetupView from "../VocabSetupView";
import VocabularyGame from "../../components/VocabularyGame";
import VocabRecognizeGame from "../../components/VocabRecognizeGame";
import VocabListeningGame from "../../components/VocabListeningGame";
import type { SessionResult } from "../../components/VocabSessionSummary";
import type { StudyEvent } from "../../goals";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  selectedVocabCategories: Set<string>;
  toggleVocabCategory: (id: string) => void;
  setSelectedVocabCategories: (s: Set<string>) => void;
  vocabSessionLength: VocabSessionLength;
  setVocabSessionLength: (n: VocabSessionLength) => void;
  filteredVocabulary: VocabWord[];
  showRomaji: boolean;
  updateShowRomaji: (v: boolean) => void;
  vocabSessionPool: VocabWord[];
  vocabSessionLimit: number;
  onStudyEvent: (event: StudyEvent) => void;
}

export default function VocabModuleViews({
  view, setView, progress, onProgressUpdate,
  selectedVocabCategories, toggleVocabCategory, setSelectedVocabCategories,
  vocabSessionLength, setVocabSessionLength, filteredVocabulary,
  showRomaji, updateShowRomaji, vocabSessionPool, vocabSessionLimit, onStudyEvent,
}: Props) {
  // One category per word actually played, so a goal can tell how much of the session was e.g. "Familia".
  function reportSession(results: SessionResult[]) {
    if (results.length === 0) return;
    const categoryByWord = new Map(vocabSessionPool.map((w) => [w.hiragana, w.category]));
    const categories = results
      .map((r) => categoryByWord.get(r.word.hiragana))
      .filter((c): c is string => !!c);
    onStudyEvent({ module: "vocab", categories });
  }

  return (
    <>
      {view === "vocabCategory" && (
        <VocabSetupView
          progress={progress}
          selectedVocabCategories={selectedVocabCategories}
          toggleVocabCategory={toggleVocabCategory}
          setSelectedVocabCategories={setSelectedVocabCategories}
          vocabSessionLength={vocabSessionLength}
          setVocabSessionLength={setVocabSessionLength}
          filteredVocabulary={filteredVocabulary}
          showRomaji={showRomaji}
          updateShowRomaji={updateShowRomaji}
          setView={setView}
        />
      )}

      {view === "spellIt" && (
        <VocabularyGame
          vocabulary={vocabSessionPool}
          progress={progress}
          showRomaji={showRomaji}
          sessionLimit={vocabSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
          onComplete={reportSession}
        />
      )}

      {view === "recognizeIt" && (
        <VocabRecognizeGame
          vocabulary={vocabSessionPool}
          progress={progress}
          sessionLimit={vocabSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
          onComplete={reportSession}
        />
      )}

      {view === "listenIt" && (
        <VocabListeningGame
          vocabulary={vocabSessionPool}
          progress={progress}
          sessionLimit={vocabSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
          onComplete={reportSession}
        />
      )}
    </>
  );
}
