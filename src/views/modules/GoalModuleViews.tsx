import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../../data";
import type { GoalDuration, GoalRow, GoalTask } from "../../goals";
import type { GoalActionResult, GoalPreview, MyGoal } from "../../hooks/useGoals";
import GoalHomeView from "../GoalHomeView";
import GoalCreateView from "../GoalCreateView";
import GoalShareView from "../GoalShareView";
import GoalJoinView from "../GoalJoinView";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
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
}

/** Shared Goals views (docs/GOALS_PLAN.md, Phase B). */
export default function GoalModuleViews({
  view, setView, session, authLoading, myGoals, loadingGoals,
  pendingGoalCode, stashGoalCode, consumeGoalCode, activeGoalId, setActiveGoalId,
  createGoal, previewGoal, joinGoal,
}: Props) {
  const activeGoal = myGoals.find((g) => g.id === activeGoalId);

  function openGoal(goalId: string) {
    setActiveGoalId(goalId);
    setView("goalShare");
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
        />
      )}

      {view === "goalCreate" && (
        <GoalCreateView setView={setView} createGoal={createGoal} onCreated={(g) => openGoal(g.id)} />
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
      {view === "goalShare" && !activeGoal && (
        <p className="text-sm text-center pt-8" style={{ color: "#8B7FA8" }}>Cargando la meta…</p>
      )}
    </>
  );
}
