import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../../data";
import type { CharWithRow, ProgressItems, SessionMode } from "../../types";
import { ALL_CHARS } from "../../data";
import { VOCABULARY } from "../../vocabulary";
import type { CompetitionModuleId, CompetitionPreview, CompetitionRow, CompetitionSize, LeaderboardEntry, MyCompetition, RivalHistory } from "../../hooks/useCompetition";
import CompetitionHomeView from "../CompetitionHomeView";
import CompetitionCreateView from "../CompetitionCreateView";
import CompetitionJoinView from "../CompetitionJoinView";
import CompetitionResultView from "../CompetitionResultView";
import VocabularyGame from "../../components/VocabularyGame";
import type { SessionResult } from "../../components/VocabSessionSummary";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  myCompetitions: MyCompetition[];
  loadingCompetitions: boolean;
  pendingInviteCode: string | null;
  activeCompetitionId: string | null;
  setActiveCompetitionId: (id: string | null) => void;
  createCompetition: (module: CompetitionModuleId, size: CompetitionSize) => Promise<CompetitionRow | null>;
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
  pendingInviteCode, activeCompetitionId, setActiveCompetitionId,
  createCompetition, previewCompetition, joinCompetition, consumeInviteCode,
  submitResult, leaderboard, rivalHistories, startSession,
  progress, onProgressUpdate,
}: Props) {
  function handleOpenCompetition(competition: MyCompetition) {
    if (competition.hasSubmitted) {
      setActiveCompetitionId(competition.id);
      setView("competeResult");
      return;
    }
    if (competition.quiz_config.module === "vocab") {
      setActiveCompetitionId(competition.id);
      setView("competePlayVocab");
      return;
    }
    const pool = ALL_CHARS.filter((c) => competition.quiz_config.items.includes(c.kana));
    if (pool.length === 0) return;
    setActiveCompetitionId(competition.id);
    startSession(pool, pool.length, "recognition", (correct, total) => {
      void submitResult(competition.id, correct, total);
    });
  }

  function handleLeavePlay() {
    setActiveCompetitionId(null);
    setView("home");
  }

  const activeCompetition = myCompetitions.find((c) => c.id === activeCompetitionId);
  const vocabPool = activeCompetition && activeCompetition.quiz_config.module === "vocab"
    ? VOCABULARY.filter((w) => activeCompetition.quiz_config.items.includes(w.hiragana))
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
