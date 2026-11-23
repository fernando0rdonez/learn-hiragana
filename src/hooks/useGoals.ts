import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { DEFAULT_AVATAR_ID } from "../avatars";
import { toISODate } from "../utils";
import { MAX_PLAYERS } from "./useCompetition";
import {
  goalPhase, goalTitle, matchingTasks, targetLabel, validateTasks,
  type GoalDuration, type GoalPhase, type GoalRow, type GoalTask, type GoalTaskRef, type StudyEvent,
} from "../goals";

export interface MyGoal extends GoalRow {
  participantCount: number;
  isCreator: boolean;
  phase: GoalPhase;
}

export interface GoalPreview {
  goal: GoalRow;
  creatorName: string;
  creatorAvatarId: string;
  participantCount: number;
  isCreator: boolean;
  alreadyJoined: boolean;
  finished: boolean;
  full: boolean;
}

export type GoalActionResult = { ok: true } | { ok: false; error: string };

const GOAL_CODE_STORAGE_KEY = "pendingGoalCode";
const PENDING_CHECKINS_KEY = "pendingGoalCheckins";

/** Shown briefly after a finished session advances a goal task (GoalToast). */
export interface GoalProgressNotice {
  label: string;    // e.g. "Gramática — Partícula に"
  sessions: number; // today's count after this session
  perDay: number;
}

/** A check-in that couldn't reach the server (offline); retried on the next load / reconnect. */
interface PendingCheckin extends GoalTaskRef {
  date: string;
}

function readPendingCheckins(): PendingCheckin[] {
  try {
    const raw = localStorage.getItem(PENDING_CHECKINS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingCheckin[]) : [];
  } catch {
    return [];
  }
}

function writePendingCheckins(items: PendingCheckin[]) {
  try {
    if (items.length === 0) localStorage.removeItem(PENDING_CHECKINS_KEY);
    else localStorage.setItem(PENDING_CHECKINS_KEY, JSON.stringify(items.slice(-50)));
  } catch {
    // storage unavailable: the check-in is lost, which only affects this one session
  }
}

/**
 * PostgREST errors from the DB carry a SQLSTATE code; a failed fetch (offline) doesn't.
 * Only the latter is worth retrying — the DB's own rejections (out-of-window date, not a
 * participant) would fail again.
 */
function isNetworkError(error: { code?: string; message?: string }): boolean {
  return !error.code;
}

function readStashedCode(): string | null {
  try {
    return typeof window !== "undefined" ? sessionStorage.getItem(GOAL_CODE_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

interface Params {
  session: Session | null;
}

/**
 * Shared Goals (docs/GOALS_PLAN.md). Phase B: create / join / list.
 * Check-ins (Phase C) and the board (Phase D) build on this hook.
 * Everything no-ops without Supabase or a session, same gate as useCompetition.
 */
export function useGoals({ session }: Params) {
  const [myGoals, setMyGoals] = useState<MyGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [pendingGoalCode, setPendingGoalCode] = useState<string | null>(readStashedCode);
  // Goal shown in goalShare (and goalBoard in Phase D).
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  function stashGoalCode(code: string) {
    try { sessionStorage.setItem(GOAL_CODE_STORAGE_KEY, code); } catch { /* private mode: keep it in memory only */ }
    setPendingGoalCode(code);
  }

  function consumeGoalCode() {
    try { sessionStorage.removeItem(GOAL_CODE_STORAGE_KEY); } catch { /* ignore */ }
    setPendingGoalCode(null);
  }

  const refreshGoals = useCallback(async () => {
    if (!isSupabaseConfigured || !session) {
      setMyGoals([]);
      return;
    }
    setLoadingGoals(true);
    const userId = session.user.id;

    // The creator is always a participant (createGoal inserts both), so membership is enough.
    const { data: memberships } = await supabase.from("goal_participants").select("goal_id").eq("user_id", userId);
    const goalIds = (memberships ?? []).map((m) => m.goal_id);
    if (goalIds.length === 0) {
      setMyGoals([]);
      setLoadingGoals(false);
      return;
    }

    const [{ data: goals }, { data: participants }] = await Promise.all([
      supabase.from("goals").select("*").in("id", goalIds),
      supabase.from("goal_participants").select("goal_id").in("goal_id", goalIds),
    ]);

    const countByGoal = new Map<string, number>();
    for (const p of participants ?? []) countByGoal.set(p.goal_id, (countByGoal.get(p.goal_id) ?? 0) + 1);

    const today = toISODate();
    const rows: MyGoal[] = ((goals ?? []) as GoalRow[])
      .map((g) => ({
        ...g,
        participantCount: countByGoal.get(g.id) ?? 0,
        isCreator: g.created_by === userId,
        phase: goalPhase(g, today),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    setMyGoals(rows);
    setLoadingGoals(false);
  }, [session]);

  useEffect(() => {
    void refreshGoals();
  }, [refreshGoals]);

  // Games report finished sessions through callbacks created during earlier renders,
  // so recordStudyEvent reads the goals from a ref instead of its closure.
  const myGoalsRef = useRef<MyGoal[]>([]);
  useEffect(() => {
    myGoalsRef.current = myGoals;
  }, [myGoals]);

  const [goalNotice, setGoalNotice] = useState<GoalProgressNotice | null>(null);
  const dismissGoalNotice = useCallback(() => setGoalNotice(null), []);

  const sendCheckin = useCallback(async (ref: GoalTaskRef, date: string): Promise<{ sessions: number } | { queued: boolean }> => {
    const { data, error } = await supabase.rpc("record_goal_session", {
      p_goal_id: ref.goalId,
      p_task_id: ref.taskId,
      p_local_date: date,
    });
    if (!error) return { sessions: data as number };
    if (isNetworkError(error)) {
      writePendingCheckins([...readPendingCheckins(), { ...ref, date }]);
      return { queued: true };
    }
    return { queued: false };
  }, []);

  const flushPendingCheckins = useCallback(async () => {
    if (!isSupabaseConfigured || !session) return;
    const pending = readPendingCheckins();
    if (pending.length === 0) return;
    writePendingCheckins([]);
    for (const item of pending) await sendCheckin(item, item.date); // re-queues itself if still offline
  }, [session, sendCheckin]);

  useEffect(() => {
    void flushPendingCheckins();
    const onOnline = () => void flushPendingCheckins();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushPendingCheckins]);

  /**
   * Called by every game when a study session finishes. Sends one check-in per active goal
   * task the session satisfies (docs/GOALS_PLAN.md, Phase C) and surfaces a short notice.
   */
  const recordStudyEvent = useCallback(async (event: StudyEvent) => {
    if (!isSupabaseConfigured || !session) return;
    const today = toISODate();
    const matches = matchingTasks(myGoalsRef.current, event, today);
    if (matches.length === 0) return;

    const notices: GoalProgressNotice[] = [];
    for (const ref of matches) {
      const result = await sendCheckin(ref, today);
      const task = myGoalsRef.current.find((g) => g.id === ref.goalId)?.tasks.find((t) => t.id === ref.taskId);
      if (task && "sessions" in result) notices.push({ label: targetLabel(task), sessions: result.sessions, perDay: task.perDay });
    }
    // With several matches, show one that this session actually moved (not already over target).
    const notice = notices.find((n) => n.sessions <= n.perDay) ?? notices[0];
    if (notice) setGoalNotice(notice);
  }, [session, sendCheckin]);

  async function createGoal(tasks: GoalTask[], durationDays: GoalDuration): Promise<{ ok: true; goal: GoalRow } | { ok: false; error: string }> {
    if (!isSupabaseConfigured || !session) return { ok: false, error: "Inicia sesión para crear una meta." };
    const invalid = validateTasks(tasks);
    if (invalid) return { ok: false, error: invalid };

    const today = toISODate();
    const { data, error } = await supabase
      .from("goals")
      .insert({ created_by: session.user.id, title: goalTitle(tasks), tasks, duration_days: durationDays, start_date: today })
      .select()
      .single();
    if (error || !data) return { ok: false, error: "No se pudo crear la meta. Intenta de nuevo." };

    const { error: joinError } = await supabase
      .from("goal_participants")
      .insert({ goal_id: data.id, user_id: session.user.id, joined_date: today });
    if (joinError) return { ok: false, error: "La meta se creó, pero no pudimos unirte. Intenta de nuevo." };

    await refreshGoals();
    return { ok: true, goal: data as GoalRow };
  }

  const previewGoal = useCallback(async (code: string): Promise<GoalPreview | { error: string }> => {
    if (!isSupabaseConfigured) return { error: "Supabase no está configurado." };
    const { data: goal } = await supabase.from("goals").select("*").eq("invite_code", code).maybeSingle();
    if (!goal) return { error: "No encontramos esa meta. Revisa el link o pide uno nuevo." };

    const [{ data: creatorProfile }, { data: participants }] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_id").eq("id", goal.created_by).maybeSingle(),
      supabase.from("goal_participants").select("user_id").eq("goal_id", goal.id),
    ]);
    const count = participants?.length ?? 0;

    return {
      goal: goal as GoalRow,
      creatorName: creatorProfile?.display_name ?? "alguien",
      creatorAvatarId: creatorProfile?.avatar_id ?? DEFAULT_AVATAR_ID,
      participantCount: count,
      isCreator: !!session && goal.created_by === session.user.id,
      alreadyJoined: !!session && (participants ?? []).some((p) => p.user_id === session.user.id),
      finished: goalPhase(goal as GoalRow, toISODate()) === "finished",
      full: count >= MAX_PLAYERS,
    };
  }, [session]);

  async function joinGoal(goalId: string): Promise<GoalActionResult> {
    if (!isSupabaseConfigured || !session) return { ok: false, error: "Inicia sesión para unirte." };
    const { error } = await supabase
      .from("goal_participants")
      .insert({ goal_id: goalId, user_id: session.user.id, joined_date: toISODate() });
    if (error) {
      if (error.code === "23505") {
        await refreshGoals();
        return { ok: true }; // already a participant — not a real error
      }
      if (error.code === "P0001") return { ok: false, error: `Esta meta ya llegó al máximo de ${MAX_PLAYERS} personas.` };
      if (error.code === "42501") return { ok: false, error: "Esta meta ya terminó." };
      return { ok: false, error: "No se pudo unir a la meta. Intenta de nuevo." };
    }
    await refreshGoals();
    return { ok: true };
  }

  return {
    myGoals, loadingGoals, refreshGoals,
    pendingGoalCode, stashGoalCode, consumeGoalCode,
    activeGoalId, setActiveGoalId,
    createGoal, previewGoal, joinGoal,
    recordStudyEvent, goalNotice, dismissGoalNotice,
  };
}
