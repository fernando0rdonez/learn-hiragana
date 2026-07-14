import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../../data";
import type { CharWithRow, ProgressItems, SessionMode } from "../../types";
import { ALL_CHARS } from "../../data";
import { VOCABULARY } from "../../vocabulary";
import type { CompetitionMode, CompetitionModuleId, CompetitionPreview, CompetitionRow, CompetitionSize, LeaderboardEntry, MyCompetition, RivalHistory } from "../../hooks/useCompetition";
import CompetitionHomeView from "../CompetitionHomeView";
import CompetitionCreateView from "../CompetitionCreateView";
import CompetitionJoinView from "../CompetitionJoinView";
import CompetitionShareView from "../CompetitionShareView";
import CompetitionResultView from "../CompetitionResultView";
import VocabularyGame from "../../components/VocabularyGame";
import type { SessionResult } from "../../components/VocabSessionSummary";
import DateTimeRecognizeGame from "../../components/DateTimeRecognizeGame";
import DateTimeWriteGame from "../../components/DateTimeWriteGame";
import DateTimeBuildGame from "../../components/DateTimeBuildGame";
import DateTimeClockInputGame from "../../components/DateTimeClockInputGame";
import { parseTimeKey } from "../../dateTime";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  myCompetitions: MyCompetition[];
  loadingCompetitions: boolean;
  pendingInviteCode: string | null;
  stashInviteCode: (code: string) => void;
  activeCompetitionId: string | null;
  setActiveCompetitionId: (id: string | null) => void;
  createCompetition: (module: CompetitionModuleId, size: CompetitionSize, mode?: CompetitionMode) => Promise<CompetitionRow | null>;
  previewCompetition: (code: string) => Promise<CompetitionPreview | { error: string }>;
  joinCompetition: (competitionId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  consumeInviteCode: () => void;
  submitResult: (competitionId: string, correct: number, total: number) => Promise<{ ok: true } | { ok: false; error: string }>;
  leaderboard: (competitionId: string) => Promise<LeaderboardEntry[]>;
  rivalHistories: () => Promise<Map<string, RivalHistory>>;
  startSession: (pool: CharWithRow[], length: number, mode?: SessionMode, onSessionComplete?: (correct: number, total: number) => void) => void;
  progress: ProgressItems;
  onProgressUpdate: (updates: ProgressItems) => void;
}

/** Fase C+D: juego de Hiragana y Vocabulario + resultado. */
export default function CompetitionModuleViews({
  view, setView, session, authLoading, myCompetitions, loadingCompetitions,
  pendingInviteCode, stashInviteCode, activeCompetitionId, setActiveCompetitionId,
  createCompetition, previewCompetition, joinCompetition, consumeInviteCode,
  submitResult, leaderboard, rivalHistories, startSession,
  progress, onProgressUpdate,
}: Props) {
  function handleJoinByCode(code: string) {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;
    stashInviteCode(trimmed);
    setView("competeJoin");
  }

  function startPlayingCompetition(competition: MyCompetition) {
    if (competition.quiz_config.module === "vocab") {
      setActiveCompetitionId(competition.id);
      setView("competePlayVocab");
      return;
    }
    if (competition.quiz_config.module === "datetime") {
      setActiveCompetitionId(competition.id);
      setView("competePlayDateTime");
      return;
    }
    const pool = ALL_CHARS.filter((c) => competition.quiz_config.items.includes(c.kana));
    if (pool.length === 0) return;
    setActiveCompetitionId(competition.id);
    startSession(pool, pool.length, "recognition", (correct, total) => {
      void submitResult(competition.id, correct, total);
    });
  }

  function handleOpenCompetition(competition: MyCompetition) {
    if (competition.hasSubmitted) {
      setActiveCompetitionId(competition.id);
      setView("competeResult");
      return;
    }
    // El creador entra primero a la pantalla de compartir — puede no haber
    // compartido el código/link todavía (ver docs/BACKLOG.md #16).
    if (competition.isCreator) {
      setActiveCompetitionId(competition.id);
      setView("competeShare");
      return;
    }
    startPlayingCompetition(competition);
  }

  function handleLeavePlay() {
    setActiveCompetitionId(null);
    setView("home");
  }

  const activeCompetition = myCompetitions.find((c) => c.id === activeCompetitionId);
  const vocabPool = activeCompetition && activeCompetition.quiz_config.module === "vocab"
    ? VOCABULARY.filter((w) => activeCompetition.quiz_config.items.includes(w.hiragana))
    : [];
  const dateTimePool = activeCompetition && activeCompetition.quiz_config.module === "datetime"
    ? activeCompetition.quiz_config.items.map(parseTimeKey)
    : [];

  return (
    <>
      {view === "competeHome" && (
        <CompetitionHomeView
          setView={setView}
          session={session}
          authLoading={authLoading}
          myCompetitions={myCompetitions}
          loadingCompetitions={loadingCompetitions}
          onOpen={handleOpenCompetition}
          onJoinByCode={handleJoinByCode}
        />
      )}

      {view === "competeCreate" && (
        <CompetitionCreateView setView={setView} createCompetition={createCompetition} />
      )}

      {view === "competeJoin" && (
        <CompetitionJoinView
          setView={setView}
          session={session}
          authLoading={authLoading}
          code={pendingInviteCode}
          previewCompetition={previewCompetition}
          joinCompetition={joinCompetition}
          consumeInviteCode={consumeInviteCode}
        />
      )}

      {view === "competeShare" && activeCompetition && (
        <CompetitionShareView
          setView={setView}
          competition={activeCompetition}
          onPlay={() => startPlayingCompetition(activeCompetition)}
        />
      )}

      {view === "competePlayVocab" && activeCompetition && vocabPool.length > 0 && (
        <VocabularyGame
          vocabulary={vocabPool}
          progress={progress}
          showRomaji={false}
          sessionLimit={vocabPool.length}
          onProgressUpdate={onProgressUpdate}
          onBack={handleLeavePlay}
          hideAudio
          onComplete={(results: SessionResult[]) => {
            const correct = results.filter((r) => r.correct).length;
            void submitResult(activeCompetition.id, correct, results.length);
          }}
          onViewCompetitionResult={() => setView("competeResult")}
        />
      )}

      {view === "competePlayDateTime" && activeCompetition && dateTimePool.length > 0 && (
        <>
          {activeCompetition.quiz_config.mode === "recognize" && (
            <DateTimeRecognizeGame
              items={dateTimePool}
              progress={progress}
              onProgressUpdate={onProgressUpdate}
              onBack={handleLeavePlay}
              onComplete={(results) => {
                const correct = results.filter((r) => r.correct).length;
                void submitResult(activeCompetition.id, correct, results.length);
              }}
              onViewCompetitionResult={() => setView("competeResult")}
            />
          )}
          {activeCompetition.quiz_config.mode === "write" && (
            <DateTimeWriteGame
              items={dateTimePool}
              progress={progress}
              onProgressUpdate={onProgressUpdate}
              onBack={handleLeavePlay}
              onComplete={(results) => {
                const correct = results.filter((r) => r.correct).length;
                void submitResult(activeCompetition.id, correct, results.length);
              }}
              onViewCompetitionResult={() => setView("competeResult")}
            />
          )}
          {activeCompetition.quiz_config.mode === "build" && (
            <DateTimeBuildGame
              level="minute"
              items={dateTimePool.map((t) => ({ ...t, useHan: false }))}
              progress={progress}
              onProgressUpdate={onProgressUpdate}
              onBack={handleLeavePlay}
              onComplete={(results) => {
                const correct = results.filter((r) => r.correct).length;
                void submitResult(activeCompetition.id, correct, results.length);
              }}
              onViewCompetitionResult={() => setView("competeResult")}
            />
          )}
          {activeCompetition.quiz_config.mode === "clock" && (
            <DateTimeClockInputGame
              items={dateTimePool}
              progress={progress}
              onProgressUpdate={onProgressUpdate}
              onBack={handleLeavePlay}
              onComplete={(results) => {
                const correct = results.filter((r) => r.correct).length;
                void submitResult(activeCompetition.id, correct, results.length);
              }}
              onViewCompetitionResult={() => setView("competeResult")}
            />
          )}
        </>
      )}

      {view === "competeResult" && (
        <CompetitionResultView
          setView={setView}
          session={session}
          competitionId={activeCompetitionId}
          myCompetitions={myCompetitions}
          leaderboard={leaderboard}
          rivalHistories={rivalHistories}
          setActiveCompetitionId={setActiveCompetitionId}
        />
      )}
    </>
  );
}
