import type { ProgressItems } from "../../types";
import type { TimeBuildLevel, ContentType, DateBuildLevel } from "../../dateTime";
import type { ViewName } from "../../data";
import DateTimeSetupView from "../DateTimeSetupView";
import DateTimeRecognizeGame from "../../components/DateTimeRecognizeGame";
import DateTimeWriteGame from "../../components/DateTimeWriteGame";
import DateTimeBuildGame from "../../components/DateTimeBuildGame";
import DateTimeClockInputGame from "../../components/DateTimeClockInputGame";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
  dateTimeContentType: ContentType;
  setDateTimeContentType: (c: ContentType) => void;
  dateTimeBuildLevel: TimeBuildLevel;
  setDateTimeBuildLevel: (l: TimeBuildLevel) => void;
  dateTimeDateLevel: DateBuildLevel;
  setDateTimeDateLevel: (l: DateBuildLevel) => void;
}

export default function DateTimeModuleViews({
  view, setView, progress, onProgressUpdate,
  dateTimeContentType, setDateTimeContentType,
  dateTimeBuildLevel, setDateTimeBuildLevel,
  dateTimeDateLevel, setDateTimeDateLevel,
}: Props) {
  return (
    <>
      {view === "dateTimeSetup" && (
        <DateTimeSetupView
          progress={progress}
          contentType={dateTimeContentType}
          setContentType={setDateTimeContentType}
          buildLevel={dateTimeBuildLevel}
          setBuildLevel={setDateTimeBuildLevel}
          dateLevel={dateTimeDateLevel}
          setDateLevel={setDateTimeDateLevel}
          setView={setView}
        />
      )}

      {view === "dateTimeRecognize" && (
        <DateTimeRecognizeGame
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("dateTimeSetup")}
          contentType={dateTimeContentType}
          dateLevel={dateTimeDateLevel}
        />
      )}

      {view === "dateTimeWrite" && (
        <DateTimeWriteGame
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("dateTimeSetup")}
          contentType={dateTimeContentType}
          dateLevel={dateTimeDateLevel}
        />
      )}

      {view === "dateTimeBuild" && (
        <DateTimeBuildGame
          level={dateTimeBuildLevel}
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("dateTimeSetup")}
          contentType={dateTimeContentType}
          dateLevel={dateTimeDateLevel}
        />
      )}

      {view === "dateTimeClock" && (
        <DateTimeClockInputGame
          progress={progress}
          sessionLimit={10}
          onProgressUpdate={onProgressUpdate}
          onBack={() => setView("dateTimeSetup")}
          contentType={dateTimeContentType}
          dateLevel={dateTimeDateLevel}
        />
      )}
    </>
  );
}
