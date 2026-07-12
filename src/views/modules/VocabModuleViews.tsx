import type { ProgressItems, VocabSessionLength } from "../../types";
import type { VocabWord } from "../../vocabulary";
import type { ViewName } from "../../data";
import VocabSetupView from "../VocabSetupView";
import VocabularyGame from "../../components/VocabularyGame";
import VocabRecognizeGame from "../../components/VocabRecognizeGame";
import VocabListeningGame from "../../components/VocabListeningGame";

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
}

export default function VocabModuleViews({
  view, setView, progress, onProgressUpdate,
  selectedVocabCategories, toggleVocabCategory, setSelectedVocabCategories,
  vocabSessionLength, setVocabSessionLength, filteredVocabulary,
  showRomaji, updateShowRomaji, vocabSessionPool, vocabSessionLimit,
}: Props) {
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
        />
      )}

      {view === "recognizeIt" && (
        <VocabRecognizeGame
          vocabulary={vocabSessionPool}
          progress={progress}
          sessionLimit={vocabSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
        />
      )}

      {view === "listenIt" && (
        <VocabListeningGame
          vocabulary={vocabSessionPool}
          progress={progress}
          sessionLimit={vocabSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
        />
      )}
    </>
  );
}
