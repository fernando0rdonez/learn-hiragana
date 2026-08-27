import type { ProgressItems, VocabSessionLength } from "../../types";
import type { ViewName } from "../../data";
import type { HonorificMode, HonorificGameMode } from "../../honorifics";
import { getHonorificPool, modesFor, honorificNotMasteredCount } from "../../honorifics";
import HonorificsSetupView from "../HonorificsSetupView";
import HonorificsDrill from "../../components/HonorificsDrill";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  honorificMode: HonorificGameMode;
  setHonorificMode: (m: HonorificGameMode) => void;
  honorificSessionLength: VocabSessionLength;
  setHonorificSessionLength: (n: VocabSessionLength) => void;
}

export default function HonorificsModuleViews({
  view, setView, progress, onProgressUpdate,
  honorificMode, setHonorificMode,
  honorificSessionLength, setHonorificSessionLength,
}: Props) {
  const modes: Set<HonorificMode> = modesFor(honorificMode);
  const pool = getHonorificPool(modes);
  const notMastered = honorificNotMasteredCount(progress, modes);
  const sessionLimit =
    honorificSessionLength === "all" ? pool.length :
    honorificSessionLength === "repasar" ? notMastered :
    Math.min(honorificSessionLength, pool.length);

  return (
    <>
      {view === "honorificsSetup" && (
        <HonorificsSetupView
          progress={progress}
          honorificMode={honorificMode}
          setHonorificMode={setHonorificMode}
          honorificSessionLength={honorificSessionLength}
          setHonorificSessionLength={setHonorificSessionLength}
          setView={setView}
        />
      )}

      {view === "honorifics" && (
        <HonorificsDrill
          exercises={pool}
          sessionLimit={sessionLimit}
          introModes={[...modes]}
          progress={progress}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("honorificsSetup")}
        />
      )}
    </>
  );
}
