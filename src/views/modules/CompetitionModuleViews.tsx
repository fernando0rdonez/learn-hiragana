import type { Session } from "@supabase/supabase-js";
import type { ViewName } from "../../data";
import type { CompetitionModuleId, CompetitionPreview, CompetitionRow, CompetitionSize, MyCompetition } from "../../hooks/useCompetition";
import CompetitionHomeView from "../CompetitionHomeView";
import CompetitionCreateView from "../CompetitionCreateView";
import CompetitionJoinView from "../CompetitionJoinView";

interface Props {
  view: ViewName;
  setView: (v: ViewName) => void;
  session: Session | null;
  authLoading: boolean;
  myCompetitions: MyCompetition[];
  loadingCompetitions: boolean;
  pendingInviteCode: string | null;
  createCompetition: (module: CompetitionModuleId, size: CompetitionSize) => Promise<CompetitionRow | null>;
  previewCompetition: (code: string) => Promise<CompetitionPreview | { error: string }>;
  joinCompetition: (competitionId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  consumeInviteCode: () => void;
}

/** Fase B: crear/unirse a retos grupales. La pantalla de resultado (Fase C) se agrega aquí cuando exista la sesión de juego del reto. */
export default function CompetitionModuleViews({
  view, setView, session, authLoading, myCompetitions, loadingCompetitions,
  pendingInviteCode, createCompetition, previewCompetition, joinCompetition, consumeInviteCode,
}: Props) {
  return (
    <>
      {view === "competeHome" && (
        <CompetitionHomeView
          setView={setView}
          session={session}
          authLoading={authLoading}
          myCompetitions={myCompetitions}
          loadingCompetitions={loadingCompetitions}
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
    </>
  );
}
