import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { ALL_CHARS } from "../data";
import { VOCABULARY } from "../vocabulary";
import { randomCompetitionTimeItems, type DateTimeCompetitionMode } from "../dateTime";
import { DEFAULT_AVATAR_ID } from "../avatars";

export type CompetitionModuleId = "hiragana" | "vocab" | "datetime";
export type CompetitionSize = 10 | 20;
export type CompetitionMode = "recognition" | "spell" | DateTimeCompetitionMode;

export interface QuizConfig {
  module: CompetitionModuleId;
  mode: CompetitionMode;
  items: string[];
}

/** Etiqueta legible de un reto, usada en CompetitionHomeView y CompetitionResultView. */
export function competitionLabel(quiz_config: QuizConfig): string {
  if (quiz_config.module === "hiragana") return "Hiragana — Reconocimiento";
  if (quiz_config.module === "vocab") return "Vocabulario — Deletrear";
  const modeLabel =
    quiz_config.mode === "recognize" ? "Reconocer" :
    quiz_config.mode === "write" ? "Escribir" : "Construir";
  return `Hora — ${modeLabel}`;
}

export interface CompetitionRow {
  id: string;
  created_by: string;
  quiz_config: QuizConfig;
  status: "pendiente" | "activa" | "completada";
  invite_code: string;
  created_at: string;
  expires_at: string;
}

export interface MyCompetition extends CompetitionRow {
  participantCount: number;
  isCreator: boolean;
  hasSubmitted: boolean;
}

export interface CompetitionPreview {
  competition: CompetitionRow;
  creatorName: string;
  creatorAvatarId: string;
  participantCount: number;
  expired: boolean;
  full: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarId: string;
  submitted: boolean;
  score: number | null;
  correct: number | null;
  total: number | null;
  isMe: boolean;
}

export interface RivalHistory {
  rivalId: string;
  rivalName: string;
  rivalAvatarId: string;
  wins: number;
  losses: number;
  ties: number;
  /** Positive = racha de victorias, negativo = racha de derrotas, 0 = sin racha activa. */
  streak: number;
}

const INVITE_CODE_STORAGE_KEY = "pendingCompeteCode";
const MAX_PLAYERS = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Params {
  session: Session | null;
}

/**
 * Retos asíncronos en grupo (docs/BACKLOG.md #16, docs/COMPETITION_PLAN.md).
 * Fase B: crear/unirse. La sesión de juego y la subida de resultado llegan en
 * la Fase C — createCompetition ya deja el snapshot de items listo para eso.
 */
export function useCompetition({ session }: Params) {
  const [myCompetitions, setMyCompetitions] = useState<MyCompetition[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  const [myAvatarId, setMyAvatarId] = useState<string | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(INVITE_CODE_STORAGE_KEY) : null
  );
  // Reto que se está jugando (mientras dura la sesión de quiz) o consultando en competeResult.
  const [activeCompetitionId, setActiveCompetitionId] = useState<string | null>(null);

  function stashInviteCode(code: string) {
    sessionStorage.setItem(INVITE_CODE_STORAGE_KEY, code);
    setPendingInviteCode(code);
  }

  function consumeInviteCode() {
    sessionStorage.removeItem(INVITE_CODE_STORAGE_KEY);
    setPendingInviteCode(null);
  }

  const refreshCompetitions = useCallback(async () => {
    if (!isSupabaseConfigured || !session) {
      setMyCompetitions([]);
      return;
    }
    setLoadingCompetitions(true);
    const userId = session.user.id;

    const [{ data: created }, { data: joinedRows }] = await Promise.all([
      supabase.from("competitions").select("*").eq("created_by", userId),
      supabase.from("competition_participants").select("competition_id").eq("user_id", userId),
    ]);

    const joinedIds = (joinedRows ?? []).map((r) => r.competition_id);
    const { data: joined } = joinedIds.length
      ? await supabase.from("competitions").select("*").in("id", joinedIds)
      : { data: [] as CompetitionRow[] };

    const byId = new Map<string, CompetitionRow>();
    for (const c of [...(created ?? []), ...(joined ?? [])]) byId.set(c.id, c as CompetitionRow);
    const competitions = [...byId.values()];

    if (competitions.length === 0) {
      setMyCompetitions([]);
      setLoadingCompetitions(false);
      return;
    }

    const ids = competitions.map((c) => c.id);
    const [{ data: participants }, { data: results }] = await Promise.all([
      supabase.from("competition_participants").select("competition_id, user_id").in("competition_id", ids),
      supabase.from("competition_results").select("competition_id, user_id").in("competition_id", ids),
    ]);

    const countByCompetition = new Map<string, number>();
    for (const p of participants ?? []) {
      countByCompetition.set(p.competition_id, (countByCompetition.get(p.competition_id) ?? 0) + 1);
    }
    const submittedSet = new Set((results ?? []).filter((r) => r.user_id === userId).map((r) => r.competition_id));

    const rows: MyCompetition[] = competitions
      .map((c) => ({
        ...c,
        participantCount: countByCompetition.get(c.id) ?? 0,
        isCreator: c.created_by === userId,
        hasSubmitted: submittedSet.has(c.id),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    setMyCompetitions(rows);
    setLoadingCompetitions(false);
  }, [session]);

  useEffect(() => {
    void refreshCompetitions();
  }, [refreshCompetitions]);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) {
      setMyDisplayName(null);
      setMyAvatarId(null);
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, avatar_id")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setMyDisplayName(data?.display_name ?? null);
        setMyAvatarId(data?.avatar_id ?? null);
      });
  }, [session]);

  /** Actualiza nombre público y/o avatar del perfil propio (editor en Ajustes). */
  async function updateProfile(displayName: string, avatarId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isSupabaseConfigured || !session) return { ok: false, error: "Inicia sesión para editar tu perfil." };
    const trimmed = displayName.trim();
    if (!trimmed) return { ok: false, error: "El nombre no puede estar vacío." };
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed, avatar_id: avatarId })
      .eq("id", session.user.id);
    if (error) return { ok: false, error: "No se pudo guardar tu perfil." };
    setMyDisplayName(trimmed);
    setMyAvatarId(avatarId);
    return { ok: true };
  }

  function resolveItems(module: CompetitionModuleId, size: number, mode: CompetitionMode): string[] {
    if (module === "hiragana") return shuffle(ALL_CHARS.map((c) => c.kana)).slice(0, size);
    if (module === "vocab") return shuffle(VOCABULARY.map((w) => w.hiragana)).slice(0, size);
    return randomCompetitionTimeItems(mode as DateTimeCompetitionMode, size);
  }

  async function createCompetition(module: CompetitionModuleId, size: CompetitionSize, mode?: CompetitionMode): Promise<CompetitionRow | null> {
    if (!isSupabaseConfigured || !session) return null;
    const resolvedMode: CompetitionMode = mode ?? (module === "hiragana" ? "recognition" : module === "vocab" ? "spell" : "recognize");
    const items = resolveItems(module, size, resolvedMode);
    const { data, error } = await supabase
      .from("competitions")
      .insert({ created_by: session.user.id, quiz_config: { module, mode: resolvedMode, items }, status: "pendiente" })
      .select()
      .single();
    if (error || !data) return null;
    await supabase.from("competition_participants").insert({ competition_id: data.id, user_id: session.user.id });
    await refreshCompetitions();
    return data as CompetitionRow;
  }

  async function previewCompetition(code: string): Promise<CompetitionPreview | { error: string }> {
    if (!isSupabaseConfigured) return { error: "Supabase no está configurado." };
    const { data: competition } = await supabase
      .from("competitions")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();
    if (!competition) return { error: "No encontramos ese reto. Revisa el link o pide uno nuevo." };

    const expired = new Date(competition.expires_at).getTime() < Date.now();
    const [{ data: creatorProfile }, { count }] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_id").eq("id", competition.created_by).maybeSingle(),
      supabase.from("competition_participants").select("*", { count: "exact", head: true }).eq("competition_id", competition.id),
    ]);

    return {
      competition: competition as CompetitionRow,
      creatorName: creatorProfile?.display_name ?? "alguien",
      creatorAvatarId: creatorProfile?.avatar_id ?? DEFAULT_AVATAR_ID,
      participantCount: count ?? 0,
      expired,
      full: (count ?? 0) >= MAX_PLAYERS,
    };
  }

  async function joinCompetition(competitionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isSupabaseConfigured || !session) return { ok: false, error: "Inicia sesión para unirte." };
    const { error } = await supabase
      .from("competition_participants")
      .insert({ competition_id: competitionId, user_id: session.user.id });
    if (error) {
      if (error.code === "23505") {
        await refreshCompetitions();
        return { ok: true }; // ya eras participante — no es un error real
      }
      if (error.code === "P0001") return { ok: false, error: `Este reto ya llegó al máximo de ${MAX_PLAYERS} jugadores.` };
      return { ok: false, error: "No se pudo unir al reto. Intenta de nuevo." };
    }
    await refreshCompetitions();
    return { ok: true };
  }

  /**
   * Sube el resultado una sola vez: reto de un solo intento, sin revanchas que
   * inflen el puntaje. Un insert duplicado (23505) significa que ya se había
   * subido — se trata como éxito silencioso, no como error.
   */
  async function submitResult(competitionId: string, correct: number, total: number): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isSupabaseConfigured || !session) return { ok: false, error: "Inicia sesión para guardar tu resultado." };
    const { error } = await supabase
      .from("competition_results")
      .insert({ competition_id: competitionId, user_id: session.user.id, score: correct, correct, total });
    if (error && error.code !== "23505") return { ok: false, error: "No se pudo guardar tu resultado." };
    await refreshCompetitions();
    return { ok: true };
  }

  /**
   * Todos los participantes del reto, con su resultado si ya lo subieron —
   * incluye a quienes aún no han jugado (submitted: false) para que la pantalla
   * de resultado pueda mostrar "N de 6 ya jugaron", no solo el ranking final.
   */
  async function leaderboard(competitionId: string): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured) return [];
    const [{ data: participants }, { data: results }] = await Promise.all([
      supabase.from("competition_participants").select("user_id").eq("competition_id", competitionId),
      supabase.from("competition_results").select("user_id, score, correct, total").eq("competition_id", competitionId),
    ]);
    if (!participants || participants.length === 0) return [];

    const resultByUser = new Map((results ?? []).map((r) => [r.user_id, r]));
    const userIds = participants.map((p) => p.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_id").in("id", userIds);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
    const avatarById = new Map((profiles ?? []).map((p) => [p.id, p.avatar_id]));
    const myId = session?.user.id;

    const entries: LeaderboardEntry[] = participants.map((p) => {
      const r = resultByUser.get(p.user_id);
      return {
        userId: p.user_id,
        displayName: nameById.get(p.user_id) ?? "alguien",
        avatarId: avatarById.get(p.user_id) ?? DEFAULT_AVATAR_ID,
        submitted: !!r,
        score: r?.score ?? null,
        correct: r?.correct ?? null,
        total: r?.total ?? null,
        isMe: p.user_id === myId,
      };
    });

    return entries.sort((a, b) => {
      if (a.submitted !== b.submitted) return a.submitted ? -1 : 1;
      return (b.score ?? 0) - (a.score ?? 0);
    });
  }

  /**
   * Historial cabeza a cabeza contra todos los rivales con los que ya se jugó
   * al menos un reto completado (competition_summary, ver docs/COMPETITION_PLAN.md
   * Fase A). Se trae todo de una vez y el componente filtra a los rivales que
   * le interesan — evita N idas y vueltas por cada rival del leaderboard.
   */
  async function rivalHistories(): Promise<Map<string, RivalHistory>> {
    const empty = new Map<string, RivalHistory>();
    if (!isSupabaseConfigured || !session) return empty;
    const myId = session.user.id;

    const { data: rows } = await supabase
      .from("competition_summary")
      .select("user_a, score_a, user_b, score_b, completed_at")
      .or(`user_a.eq.${myId},user_b.eq.${myId}`)
      .order("completed_at", { ascending: true });
    if (!rows || rows.length === 0) return empty;

    const rivalIds = [...new Set(rows.map((r) => (r.user_a === myId ? r.user_b : r.user_a)))];
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_id").in("id", rivalIds);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
    const avatarById = new Map((profiles ?? []).map((p) => [p.id, p.avatar_id]));

    const byRival = new Map<string, RivalHistory>();
    for (const row of rows) {
      const rivalId    = row.user_a === myId ? row.user_b : row.user_a;
      const myScore    = row.user_a === myId ? row.score_a : row.score_b;
      const rivalScore = row.user_a === myId ? row.score_b : row.score_a;
      const outcome: "win" | "loss" | "tie" = myScore > rivalScore ? "win" : myScore < rivalScore ? "loss" : "tie";

      const prev = byRival.get(rivalId) ?? {
        rivalId,
        rivalName: nameById.get(rivalId) ?? "alguien",
        rivalAvatarId: avatarById.get(rivalId) ?? DEFAULT_AVATAR_ID,
        wins: 0, losses: 0, ties: 0, streak: 0,
      };
      if (outcome === "win") prev.wins += 1;
      else if (outcome === "loss") prev.losses += 1;
      else prev.ties += 1;

      if (outcome === "tie") prev.streak = 0;
      else if (outcome === "win") prev.streak = prev.streak > 0 ? prev.streak + 1 : 1;
      else prev.streak = prev.streak < 0 ? prev.streak - 1 : -1;

      byRival.set(rivalId, prev);
    }
    return byRival;
  }

  return {
    myCompetitions,
    loadingCompetitions,
    myDisplayName,
    myAvatarId,
    updateProfile,
    pendingInviteCode,
    stashInviteCode,
    consumeInviteCode,
    activeCompetitionId,
    setActiveCompetitionId,
    createCompetition,
    previewCompetition,
    joinCompetition,
    submitResult,
    leaderboard,
    rivalHistories,
    refreshCompetitions,
  };
}
