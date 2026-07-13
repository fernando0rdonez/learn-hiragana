import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { ALL_CHARS } from "../data";
import { VOCABULARY } from "../vocabulary";

export type CompetitionModuleId = "hiragana" | "vocab";
export type CompetitionSize = 10 | 20;

export interface QuizConfig {
  module: CompetitionModuleId;
  mode: "recognition" | "spell";
  items: string[];
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
  participantCount: number;
  expired: boolean;
  full: boolean;
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
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(INVITE_CODE_STORAGE_KEY) : null
  );

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
      return;
    }
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setMyDisplayName(data?.display_name ?? null));
  }, [session]);

  function resolveItems(module: CompetitionModuleId, size: number): string[] {
    if (module === "hiragana") return shuffle(ALL_CHARS.map((c) => c.kana)).slice(0, size);
    return shuffle(VOCABULARY.map((w) => w.hiragana)).slice(0, size);
  }

  async function createCompetition(module: CompetitionModuleId, size: CompetitionSize): Promise<CompetitionRow | null> {
    if (!isSupabaseConfigured || !session) return null;
    const items = resolveItems(module, size);
    const mode = module === "hiragana" ? "recognition" : "spell";
    const { data, error } = await supabase
      .from("competitions")
      .insert({ created_by: session.user.id, quiz_config: { module, mode, items }, status: "pendiente" })
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
      supabase.from("profiles").select("display_name").eq("id", competition.created_by).maybeSingle(),
      supabase.from("competition_participants").select("*", { count: "exact", head: true }).eq("competition_id", competition.id),
    ]);

    return {
      competition: competition as CompetitionRow,
      creatorName: creatorProfile?.display_name ?? "alguien",
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

  return {
    myCompetitions,
    loadingCompetitions,
    myDisplayName,
    pendingInviteCode,
    stashInviteCode,
    consumeInviteCode,
    createCompetition,
    previewCompetition,
    joinCompetition,
    refreshCompetitions,
  };
}
