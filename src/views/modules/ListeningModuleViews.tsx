import type { ProgressItems, VocabSessionLength } from "../../types";
import type { ListeningSentence } from "../../listening";
import type { ViewName } from "../../data";
import ListeningSetupView from "../ListeningSetupView";
import ListeningComprehensionGame from "../../components/ListeningComprehensionGame";
import ListeningDictationGame from "../../components/ListeningDictationGame";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  listeningSessionLength: VocabSessionLength;
  setListeningSessionLength: (n: VocabSessionLength) => void;
  listeningSessionPool: ListeningSentence[];
  listeningSessionLimit: number;
}

export default function ListeningModuleViews({
  view, setView, progress, onProgressUpdate,
  listeningSessionLength, setListeningSessionLength, listeningSessionPool, listeningSessionLimit,
}: Props) {
  return (
    <>
      {view === "listeningSetup" && (
        <ListeningSetupView
          progress={progress}
          listeningSessionLength={listeningSessionLength}
          setListeningSessionLength={setListeningSessionLength}
          setView={setView}
        />
      )}

      {view === "listeningComprehension" && (
        <ListeningComprehensionGame
          sentences={listeningSessionPool}
          progress={progress}
          sessionLimit={listeningSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("listeningSetup")}
        />
      )}

      {view === "listeningDictation" && (
        <ListeningDictationGame
          sentences={listeningSessionPool}
          progress={progress}
          sessionLimit={listeningSessionLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("listeningSetup")}
        />
      )}
    </>
  );
}
