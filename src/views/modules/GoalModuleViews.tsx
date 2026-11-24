import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../../data";
import type { ScannedInvite } from "../../qrInvite";
import type { GoalDuration, GoalRow, GoalTask } from "../../goals";
import type { GoalActionResult, GoalBoard, GoalPreview, MyGoal } from "../../hooks/useGoals";
import GoalHomeView from "../GoalHomeView";
import GoalCreateView from "../GoalCreateView";
import GoalShareView from "../GoalShareView";
import GoalJoinView from "../GoalJoinView";
import GoalBoardView from "../GoalBoardView";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  /** Routes a scanned invite to the competition or goal join view. */
  onScannedInvite: (invite: ScannedInvite) => void;
  session: Session | null;
  authLoading: boolean;
  myGoals: MyGoal[];
  loadingGoals: boolean;
  pendingGoalCode: string | null;
  stashGoalCode: (code: string) => void;
  consumeGoalCode: () => void;
  activeGoalId: string | null;
  setActiveGoalId: (id: string | null) => void;
  createGoal: (tasks: GoalTask[], durationDays: GoalDuration) => Promise<{ ok: true; goal: GoalRow } | { ok: false; error: string }>;
  previewGoal: (code: string) => Promise<GoalPreview | { error: string }>;
  joinGoal: (goalId: string) => Promise<GoalActionResult>;
  loadBoard: (goalId: string) => Promise<GoalBoard | { error: string }>;
  onPractice: (task: GoalTask) => void;
}

/** Shared Goals views (docs/GOALS_PLAN.md, Phases B and D). */
export default function GoalModuleViews({
  view, setView, onScannedInvite, session, authLoading, myGoals, loadingGoals,
  pendingGoalCode, stashGoalCode, consumeGoalCode, activeGoalId, setActiveGoalId,
  createGoal, previewGoal, joinGoal, loadBoard, onPractice,
}: Props) {
  const activeGoal = myGoals.find((g) => g.id === activeGoalId);

  function openGoal(goalId: string) {
    setActiveGoalId(goalId);
    setView("goalBoard");
  }

  function handleJoinByCode(code: string) {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;
    stashGoalCode(trimmed);
    setView("goalJoin");
  }

  return (
    <>
      {view === "goalHome" && (
        <GoalHomeView
          setView={setView}
          session={session}
          authLoading={authLoading}
          myGoals={myGoals}
          loadingGoals={loadingGoals}
          onOpen={(g) => openGoal(g.id)}
          onJoinByCode={handleJoinByCode}
          onScanned={onScannedInvite}
        />
      )}

      {view === "goalCreate" && (
        <GoalCreateView
          setView={setView}
          createGoal={createGoal}
          // A new goal has nobody to show yet: go straight to inviting people.
          onCreated={(g) => { setActiveGoalId(g.id); setView("goalShare"); }}
        />
      )}

      {view === "goalJoin" && (
        <GoalJoinView
          setView={setView}
          session={session}
          authLoading={authLoading}
          code={pendingGoalCode}
          previewGoal={previewGoal}
          joinGoal={joinGoal}
          consumeGoalCode={consumeGoalCode}
          onJoined={openGoal}
        />
      )}

      {view === "goalShare" && activeGoal && <GoalShareView setView={setView} goal={activeGoal} />}
      {view === "goalBoard" && activeGoalId && (
        <GoalBoardView
          goalId={activeGoalId}
          setView={setView}
          loadBoard={loadBoard}
          onPractice={onPractice}
          onInvite={() => setView("goalShare")}
        />
      )}

      {view === "goalShare" && !activeGoal && (
        <p className="text-sm text-center pt-8" style={{ color: "#8B7FA8" }}>Cargando la meta…</p>
      )}
    </>
  );
}
