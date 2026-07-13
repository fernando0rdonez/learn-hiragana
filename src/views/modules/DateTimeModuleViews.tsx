import type { ProgressItems } from "../../types";
import type { TimeBuildLevel } from "../../dateTime";
import type { ViewName } from "../../data";
import DateTimeSetupView from "../DateTimeSetupView";
import DateTimeRecognizeGame from "../../components/DateTimeRecognizeGame";
import DateTimeWriteGame from "../../components/DateTimeWriteGame";
import DateTimeBuildGame from "../../components/DateTimeBuildGame";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  dateTimeBuildLevel: TimeBuildLevel;
  setDateTimeBuildLevel: (l: TimeBuildLevel) => void;
}

export default function DateTimeModuleViews({
  view, setView, progress, onProgressUpdate, dateTimeBuildLevel, setDateTimeBuildLevel,
}: Props) {
  return (
    <>
      {view === "dateTimeSetup" && (
        <DateTimeSetupView
          progress={progress}
          buildLevel={dateTimeBuildLevel}
          setBuildLevel={setDateTimeBuildLevel}
          setView={setView}
        />
      )}

      {view === "dateTimeRecognize" && (
        <DateTimeRecognizeGame
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("dateTimeSetup")}
        />
      )}

      {view === "dateTimeWrite" && (
        <DateTimeWriteGame
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("dateTimeSetup")}
        />
      )}

      {view === "dateTimeBuild" && (
        <DateTimeBuildGame
          level={dateTimeBuildLevel}
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("dateTimeSetup")}
        />
      )}
    </>
  );
}
