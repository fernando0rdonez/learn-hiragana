import type { ProgressItems, VocabSessionLength } from "../../types";
import type { Phrase } from "../../phrases";
import type { ViewName } from "../../data";
import PhraseSetupView from "../PhraseSetupView";
import PhraseMeaningGame from "../../components/PhraseMeaningGame";
import PhraseListeningGame from "../../components/PhraseListeningGame";
import PhraseBuildGame from "../../components/PhraseBuildGame";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  selectedPhraseCategories: Set<string>;
  togglePhraseCategory: (id: string) => void;
  setSelectedPhraseCategories: (s: Set<string>) => void;
  phraseSessionLength: VocabSessionLength;
  setPhraseSessionLength: (n: VocabSessionLength) => void;
  filteredPhrases: Phrase[];
  phraseSessionPool: Phrase[];
  phraseSessionLimit: number;
}

export default function PhraseModuleViews({
  view, setView, progress, onProgressUpdate,
  selectedPhraseCategories, togglePhraseCategory, setSelectedPhraseCategories,
  phraseSessionLength, setPhraseSessionLength, filteredPhrases,
  phraseSessionPool, phraseSessionLimit,
}: Props) {
  return (
    <>
      {view === "phraseSetup" && (
        <PhraseSetupView
          progress={progress}
          selectedPhraseCategories={selectedPhraseCategories}
          togglePhraseCategory={togglePhraseCategory}
          setSelectedPhraseCategories={setSelectedPhraseCategories}
          phraseSessionLength={phraseSessionLength}
          setPhraseSessionLength={setPhraseSessionLength}
          filteredPhrases={filteredPhrases}
          setView={setView}
        />
      )}

      {view === "phraseMeaning" && (
        <PhraseMeaningGame
          phrases={phraseSessionPool}
          progress={progress}
          sessionLimit={phraseSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
        />
      )}

      {view === "phraseListening" && (
        <PhraseListeningGame
          phrases={phraseSessionPool}
          progress={progress}
          sessionLimit={phraseSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
        />
      )}

      {view === "phraseBuild" && (
        <PhraseBuildGame
          phrases={phraseSessionPool}
          progress={progress}
          sessionLimit={phraseSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
        />
      )}
    </>
  );
}
