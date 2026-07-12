import type { ProgressItems, VocabSessionLength } from "../../types";
import type { KanjiEntry } from "../../kanji";
import type { ViewName } from "../../data";
import KanjiSetupView from "../KanjiSetupView";
import KanjiMeaningGame from "../../components/KanjiMeaningGame";
import KanjiReadingGame from "../../components/KanjiReadingGame";
import KanjiMatchGame from "../../components/KanjiMatchGame";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  selectedKanjiGroups: Set<string>;
  toggleKanjiGroup: (id: string) => void;
  setSelectedKanjiGroups: (s: Set<string>) => void;
  kanjiSessionLength: VocabSessionLength;
  setKanjiSessionLength: (n: VocabSessionLength) => void;
  filteredKanji: KanjiEntry[];
  kanjiSessionPool: KanjiEntry[];
  kanjiSessionLimit: number;
}

export default function KanjiModuleViews({
  view, setView, progress, onProgressUpdate,
  selectedKanjiGroups, toggleKanjiGroup, setSelectedKanjiGroups,
  kanjiSessionLength, setKanjiSessionLength, filteredKanji,
  kanjiSessionPool, kanjiSessionLimit,
}: Props) {
  return (
    <>
      {view === "kanjiSetup" && (
        <KanjiSetupView
          progress={progress}
          selectedKanjiGroups={selectedKanjiGroups}
          toggleKanjiGroup={toggleKanjiGroup}
          setSelectedKanjiGroups={setSelectedKanjiGroups}
          kanjiSessionLength={kanjiSessionLength}
          setKanjiSessionLength={setKanjiSessionLength}
          filteredKanji={filteredKanji}
          setView={setView}
        />
      )}

      {view === "kanjiMeaning" && (
        <KanjiMeaningGame
          kanjiList={kanjiSessionPool}
          progress={progress}
          sessionLimit={kanjiSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("kanjiSetup")}
        />
      )}

      {view === "kanjiReading" && (
        <KanjiReadingGame
          kanjiList={kanjiSessionPool}
          progress={progress}
          sessionLimit={kanjiSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("kanjiSetup")}
        />
      )}

      {view === "kanjiMatch" && (
        <KanjiMatchGame kanjiList={filteredKanji} onBack={() => setView("kanjiSetup")} />
      )}
    </>
  );
}
