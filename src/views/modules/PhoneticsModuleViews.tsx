import type { ProgressItems } from "../../types";
import type { PhoneticEntry } from "../../phonetics";
import type { ViewName } from "../../data";
import PhoneticSetupView from "../PhoneticSetupView";
import PhoneticsDrill from "../../components/PhoneticsDrill";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  selectedPhenomena: Set<string>;
  togglePhenomenon: (id: string) => void;
  phoneticPool: PhoneticEntry[];
}

export default function PhoneticsModuleViews({
  view, setView, progress, onProgressUpdate, selectedPhenomena, togglePhenomenon, phoneticPool,
}: Props) {
  return (
    <>
      {view === "phoneticSetup" && (
        <PhoneticSetupView
          selectedPhenomena={selectedPhenomena}
          togglePhenomenon={togglePhenomenon}
          phoneticPool={phoneticPool}
          setView={setView}
        />
      )}

      {view === "phonetics" && (
        <PhoneticsDrill
          phoneticWords={phoneticPool}
          progress={progress}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("home")}
        />
      )}
    </>
  );
}
