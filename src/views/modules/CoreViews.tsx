import type { Session } from "@supabase/supabase-js";
import type { ProgressData, ProgressItems, StreakData, DailyProgress } from "../../types";
import type { ViewName } from "../../data";
import HomeView from "../HomeView";
import SettingsView from "../SettingsView";
import MethodologyView from "../MethodologyView";
import StatsView from "../StatsView";
import RoadmapView from "../RoadmapView";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  progress: ProgressItems;
  streak: StreakData;
  dailyProgress: DailyProgress;
  today: string;
  masteredTotal: number;
  masteredKataTotal: number;
  masteredNumberKeys: number;
  masteredDateTimeKeys: number;
  masteredPhrasesTotal: number;
  masteredKanjiTotal: number;
  masteredGrammarTotal: number;
  masteredListeningTotal: number;
  saveError: boolean;
  resetConfirm: boolean;
  setResetConfirm: (v: boolean) => void;
  resetProgress: () => void;
  exportProgress: () => void;
  importError: string | null;
  pendingImport: ProgressData | null;
  importSuccess: boolean;
  stageImport: (file: File) => void;
  confirmImport: () => void;
  cancelImport: () => void;
  session: Session | null;
  authLoading: boolean;
  otpStage: "idle" | "codeSent" | "verifying";
  otpError: string | null;
  pendingEmail: string;
  cooldownSeconds: number;
  requestCode: (email: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  cancelOtp: () => void;
  signOut: () => Promise<void>;
  pushNow: () => Promise<void>;
  syncing: boolean;
}

/** Vistas "de la app" sin estado de setup propio — home, ajustes y las pantallas informativas. */
export default function CoreViews({
  view, setView, progress, streak, dailyProgress, today,
  masteredTotal, masteredKataTotal, masteredNumberKeys, masteredDateTimeKeys, masteredPhrasesTotal,
  masteredKanjiTotal, masteredGrammarTotal, masteredListeningTotal, saveError,
  resetConfirm, setResetConfirm, resetProgress, exportProgress,
  importError, pendingImport, importSuccess, stageImport, confirmImport, cancelImport,
  session, authLoading, otpStage, otpError, pendingEmail, cooldownSeconds,
  requestCode, verifyCode, cancelOtp, signOut, pushNow, syncing,
}: Props) {
  return (
    <>
      {view === "home" && (
        <HomeView
          streak={streak}
          masteredTotal={masteredTotal}
          masteredKataTotal={masteredKataTotal}
          masteredNumberKeys={masteredNumberKeys}
          masteredDateTimeKeys={masteredDateTimeKeys}
          masteredPhrasesTotal={masteredPhrasesTotal}
          masteredKanjiTotal={masteredKanjiTotal}
          masteredGrammarTotal={masteredGrammarTotal}
          masteredListeningTotal={masteredListeningTotal}
          saveError={saveError}
          setView={setView}
        />
      )}

      {view === "settings" && (
        <SettingsView
          setView={setView}
          resetConfirm={resetConfirm}
          setResetConfirm={setResetConfirm}
          resetProgress={resetProgress}
          exportProgress={exportProgress}
          importError={importError}
          pendingImport={pendingImport}
          importSuccess={importSuccess}
          stageImport={stageImport}
          confirmImport={confirmImport}
          cancelImport={cancelImport}
          session={session}
          authLoading={authLoading}
          otpStage={otpStage}
          otpError={otpError}
          pendingEmail={pendingEmail}
          cooldownSeconds={cooldownSeconds}
          requestCode={requestCode}
          verifyCode={verifyCode}
          cancelOtp={cancelOtp}
          signOut={signOut}
          pushNow={pushNow}
          syncing={syncing}
        />
      )}

      {view === "methodology" && <MethodologyView setView={setView} />}

      {view === "stats" && (
        <StatsView
          progress={progress}
          streak={streak}
          dailyProgress={dailyProgress}
          masteredTotal={masteredTotal}
          today={today}
          setView={setView}
        />
      )}

      {view === "roadmap" && <RoadmapView progress={progress} setView={setView} />}
    </>
  );
}
