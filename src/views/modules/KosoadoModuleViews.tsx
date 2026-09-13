import type { ProgressItems, VocabSessionLength } from "../../types";
import type { ViewName } from "../../data";
import type { KosoadoMode, KosoadoGameMode } from "../../kosoado";
import { getKosoadoPool, modesFor, kosoadoNotMasteredCount } from "../../kosoado";
import KosoadoSetupView from "../KosoadoSetupView";
import KosoadoDrill from "../../components/KosoadoDrill";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  kosoadoMode: KosoadoGameMode;
  setKosoadoMode: (m: KosoadoGameMode) => void;
  kosoadoSessionLength: VocabSessionLength;
  setKosoadoSessionLength: (n: VocabSessionLength) => void;
}

export default function KosoadoModuleViews({
  view, setView, progress, onProgressUpdate,
  kosoadoMode, setKosoadoMode,
  kosoadoSessionLength, setKosoadoSessionLength,
}: Props) {
  const modes: Set<KosoadoMode> = modesFor(kosoadoMode);
  const pool = getKosoadoPool(modes);
  const notMastered = kosoadoNotMasteredCount(progress, modes);
  const sessionLimit =
    kosoadoSessionLength === "all" ? pool.length :
    kosoadoSessionLength === "repasar" ? notMastered :
    Math.min(kosoadoSessionLength, pool.length);

  return (
    <>
      {view === "kosoadoSetup" && (
        <KosoadoSetupView
          progress={progress}
          kosoadoMode={kosoadoMode}
          setKosoadoMode={setKosoadoMode}
          kosoadoSessionLength={kosoadoSessionLength}
          setKosoadoSessionLength={setKosoadoSessionLength}
          setView={setView}
        />
      )}

      {view === "kosoado" && (
        <KosoadoDrill
          exercises={pool}
          sessionLimit={sessionLimit}
          introModes={[...modes]}
          progress={progress}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("kosoadoSetup")}
        />
      )}
    </>
  );
}
