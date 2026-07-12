import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ProgressData } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { validateProgressData, mergeProgressData } from "../storage";

interface Params {
  session: Session | null;
  snapshot: ProgressData;
  onRemoteProgress: (data: ProgressData) => void;
}

/**
 * Sync al ocultar/cerrar la pestaña y al iniciar sesión en un dispositivo
 * nuevo. Cada push primero descarga la fila remota y la fusiona
 * (mergeProgressData) con el snapshot local antes de subir, para que dos
 * dispositivos usados el mismo día no se pisen el progreso entre sí — el
 * resultado fusionado también se aplica en local. Sin sync en tiempo real:
 * deliberadamente "solo al terminar la sesión de estudio" (docs/BACKLOG.md #15).
 */
export function useProgressSync({ session, snapshot, onRemoteProgress }: Params) {
  const snapshotRef = useRef(snapshot);
  const onRemoteRef = useRef(onRemoteProgress);
  const pulledForUser = useRef<string | null>(null);

  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);
  useEffect(() => { onRemoteRef.current = onRemoteProgress; }, [onRemoteProgress]);
  const [syncing, setSyncing] = useState(false);

  async function pushNow() {
    if (!isSupabaseConfigured || !session) return;
    setSyncing(true);
    const { data, error } = await supabase
      .from("progress")
      .select("data")
      .eq("user_id", session.user.id)
      .maybeSingle();

    let merged = snapshotRef.current;
    if (!error && data?.data) {
      try {
        merged = mergeProgressData(snapshotRef.current, validateProgressData(data.data, "datos"));
      } catch {
        // fila remota corrupta/incompatible — se sube el snapshot local tal cual
      }
    }

    await supabase.from("progress").upsert({
      user_id: session.user.id,
      data: merged,
      updated_at: new Date().toISOString(),
    });
    if (merged !== snapshotRef.current) onRemoteRef.current(merged);
    setSyncing(false);
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    if (pulledForUser.current === session.user.id) return;
    pulledForUser.current = session.user.id;
    void pushNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    function handleVisibility() {
      if (document.visibilityState === "hidden") void pushNow();
    }
    function handlePageHide() {
      void pushNow();
    }
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return { pushNow, syncing };
}
