import type { ProgressItems } from "../../types";
import type { KeyNumber, BuildLevel, BuildLevelDef } from "../../numbers";
import type { ViewName } from "../../data";
import NumberSetupView, { type NumberKeysLength } from "../NumberSetupView";
import NumberKeysGame from "../../components/NumberKeysGame";
import NumberBuildGame from "../../components/NumberBuildGame";
import NumberDigitInputGame from "../../components/NumberDigitInputGame";
import VocabCountingGame from "../../components/VocabCountingGame";
import { VOCABULARY } from "../../vocabulary";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  selectedNumberGroups: Set<string>;
  toggleNumberGroup: (id: string) => void;
  numberKeysLength: NumberKeysLength;
  setNumberKeysLength: (n: NumberKeysLength) => void;
  numberBuildLevel: BuildLevel;
  setNumberBuildLevel: (l: BuildLevel) => void;
  numberKeysPool: KeyNumber[];
  numberKeysLimit: number;
  numberBuildLevelDef: BuildLevelDef;
}

export default function NumberModuleViews({
  view, setView, progress, onProgressUpdate,
  selectedNumberGroups, toggleNumberGroup, numberKeysLength, setNumberKeysLength,
  numberBuildLevel, setNumberBuildLevel, numberKeysPool, numberKeysLimit, numberBuildLevelDef,
}: Props) {
  return (
    <>
      {view === "numberSetup" && (
        <NumberSetupView
          progress={progress}
          selectedGroups={selectedNumberGroups}
          toggleGroup={toggleNumberGroup}
          keysLength={numberKeysLength}
          setKeysLength={setNumberKeysLength}
          buildLevel={numberBuildLevel}
          setBuildLevel={setNumberBuildLevel}
          setView={setView}
        />
      )}

      {view === "numberKeys" && (
        <NumberKeysGame
          pool={numberKeysPool}
          progress={progress}
          sessionLimit={numberKeysLimit}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("numberSetup")}
        />
      )}

      {view === "numberBuild" && (
        <NumberBuildGame
          level={numberBuildLevelDef}
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("numberSetup")}
        />
      )}

      {view === "numberDigits" && (
        <NumberDigitInputGame
          level={numberBuildLevelDef}
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("numberSetup")}
        />
      )}

      {view === "countIt" && (
        <VocabCountingGame
          vocabulary={VOCABULARY}
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("numberSetup")}
        />
      )}
    </>
  );
}
