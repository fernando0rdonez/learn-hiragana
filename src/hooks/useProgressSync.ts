import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ProgressData } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { validateProgressData } from "../storage";

interface Params {
  session: Session | null;
  snapshot: ProgressData;
  onRemoteProgress: (data: ProgressData) => void;
}

/**
 * Push del ProgressData completo al ocultar/cerrar la pestaña, y pull (vía el
 * flujo de confirmación existente en useProgress) al iniciar sesión en un
 * dispositivo nuevo. Sin sync en tiempo real: deliberadamente "solo al
 * terminar la sesión de estudio" (docs/BACKLOG.md #15).
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
    await supabase.from("progress").upsert({
      user_id: session.user.id,
      data: snapshotRef.current,
      updated_at: new Date().toISOString(),
    });
    setSyncing(false);
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    if (pulledForUser.current === session.user.id) return;
    pulledForUser.current = session.user.id;
    supabase
      .from("progress")
      .select("data")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data?.data) return;
        try {
          onRemoteRef.current(validateProgressData(data.data, "datos"));
        } catch {
          // fila remota corrupta/incompatible — se ignora, el progreso local no se toca
        }
      });
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
