import { useState, useEffect } from "react";
import type {
  CharWithRow,
  ProgressItems,
  SessionMode,
  VocabSessionLength,
} from "./types";
import { buildSessionQueue } from "./leitner";
import { CONFUSED_PAIRS } from "./confusedPairs";
import { KATAKANA_CONFUSED_PAIRS } from "./confusedPairsKatakana";
import { getAvailableWords } from "./words";
import { getAvailableKatakanaWords } from "./wordsKatakana";
import { VOCABULARY } from "./vocabulary";
import { PHRASES } from "./phrases";
import { KANJI } from "./kanji";
import { GRAMMAR_LESSONS } from "./grammar";
import { LISTENING_SENTENCES } from "./listening";
import { DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS } from "./streak";
import { getAvailablePhonetics } from "./phonetics";
import ConfettiOverlay from "./components/ConfettiOverlay";
import { type ViewName, ALL_CHARS } from "./data";
import { KATAKANA_ALL_CHARS, KATAKANA_ALL_ROW_GROUPS } from "./dataKatakana";
import { toISODate, buildQueueItems, charStatus, rowStats, resolveVocabSession, resolvePhraseSession, phraseStatus, resolveKanjiSession, kanjiStatus, grammarStatus, resolveListeningSession, listeningStatus } from "./utils";
import { useProgress } from "./hooks/useProgress";
import { useStreak } from "./hooks/useStreak";
import { useSession } from "./hooks/useSession";
import { useAuth } from "./hooks/useAuth";
import { useProgressSync } from "./hooks/useProgressSync";
import { useCompetition } from "./hooks/useCompetition";
import { isSupabaseConfigured } from "./lib/supabase";
import { CURRENT_SCHEMA_VERSION } from "./storage";
import { type NumberKeysLength } from "./views/NumberSetupView";
import type { BuildLevel } from "./numbers";
import { KEY_NUMBERS, KEY_NUMBER_GROUPS, BUILD_LEVELS, numberKeyStatus } from "./numbers";
import type { TimeBuildLevel } from "./dateTime";
import { KEY_HOURS, KEY_MINUTE_UNITS, hourKeyStatus, minuteKeyStatus } from "./dateTime";
import HiraganaSetupView from "./views/HiraganaSetupView";
import KatakanaSetupView from "./views/KatakanaSetupView";
import QuizView from "./views/QuizView";
import CoreViews from "./views/modules/CoreViews";
import PhoneticsModuleViews from "./views/modules/PhoneticsModuleViews";
import VocabModuleViews from "./views/modules/VocabModuleViews";
import PhraseModuleViews from "./views/modules/PhraseModuleViews";
import KanjiModuleViews from "./views/modules/KanjiModuleViews";
import GrammarModuleViews from "./views/modules/GrammarModuleViews";
import ListeningModuleViews from "./views/modules/ListeningModuleViews";
import NumberModuleViews from "./views/modules/NumberModuleViews";
import DateTimeModuleViews from "./views/modules/DateTimeModuleViews";
import CompetitionModuleViews from "./views/modules/CompetitionModuleViews";

// Vistas de estudio activo — salir de cualquiera de estas hacia una vista
// que no está en el set dispara un push (ver setView más abajo).
const STUDY_VIEWS = new Set<ViewName>([
  "quiz", "preview", "summary", "spellIt", "recognizeIt", "listenIt",
  "numberKeys", "numberBuild", "countIt", "phonetics",
  "dateTimeRecognize", "dateTimeWrite", "dateTimeBuild",
  "phraseMeaning", "phraseListening",
  "kanjiMeaning", "kanjiReading", "kanjiMatch",
  "grammarLesson",
  "listeningComprehension", "listeningDictation",
]);

// ── Component ──────────────────────────────────────────────────────────────

export default function HiraganaTrainer() {
  const { streak, setStreak, dailyProgress, setDailyProgress } = useStreak();
  const {
    loading, saveError, progress, setProgress, showRomaji, persist, updateShowRomaji,
    exportProgress, importError, pendingImport, importSuccess, stageImport, adoptRemoteProgress, confirmImport, cancelImport,
  } = useProgress({
    streak, dailyProgress, setStreak, setDailyProgress,
  });
  const {
    session, authLoading, otpStage, otpError, pendingEmail, cooldownSeconds, requestCode, verifyCode, cancelOtp, signOut,
  } = useAuth();
  const { pushNow, syncing } = useProgressSync({
    session,
    snapshot: { items: progress, streak, dailyProgress, settings: { showRomaji }, schemaVersion: CURRENT_SCHEMA_VERSION },
    onRemoteProgress: adoptRemoteProgress,
  });
  const {
    myCompetitions, loadingCompetitions, pendingInviteCode,
    stashInviteCode, consumeInviteCode,
    activeCompetitionId, setActiveCompetitionId,
    createCompetition, previewCompetition, joinCompetition,
    submitResult, leaderboard, rivalHistories,
  } = useCompetition({ session });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedDakutenRows, setSelectedDakutenRows] = useState<Set<string>>(new Set());
  const [selectedCompoundRows, setSelectedCompoundRows] = useState<Set<string>>(new Set());
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(new Set());
  const [selectedKataRows, setSelectedKataRows] = useState<Set<string>>(new Set());
  const [selectedKataDakutenRows, setSelectedKataDakutenRows] = useState<Set<string>>(new Set());
  const [selectedKataCompoundRows, setSelectedKataCompoundRows] = useState<Set<string>>(new Set());
  const [selectedKataPairs, setSelectedKataPairs] = useState<Set<number>>(new Set());
  const [kataSessionMode, setKataSessionMode] = useState<SessionMode>("recognition");
  const [kataSessionLength, setKataSessionLength] = useState<10 | 20 | "all">(20);
  const [selectedPhenomena, setSelectedPhenomena] = useState<Set<string>>(new Set());
  const [view, setViewRaw]          = useState<ViewName>("home");

  /**
   * Envuelve el setState crudo para empujar el progreso a Supabase justo al
   * salir de una vista de estudio activa (terminar el quiz o volver atrás a
   * mitad de camino) — sin esperar a que se oculte/cierre la pestaña.
   * Cerrar la pestaña a mitad de un quiz sigue sin sincronizar hasta el
   * próximo visibilitychange/pagehide; eso es intencional.
   */
  function setView(next: ViewName) {
    if (STUDY_VIEWS.has(view) && !STUDY_VIEWS.has(next)) void pushNow();
    setViewRaw(next);
  }

  const [resetConfirm, setResetConfirm] = useState(false);
  const [sessionMode, setSessionMode]   = useState<SessionMode>("recognition");
  const [sessionLength, setSessionLength] = useState<10 | 20 | "all">(20);
  const [selectedVocabCategories, setSelectedVocabCategories] = useState<Set<string>>(new Set());
  const [vocabSessionLength, setVocabSessionLength] = useState<VocabSessionLength>(20);
  const [selectedPhraseCategories, setSelectedPhraseCategories] = useState<Set<string>>(new Set());
  const [phraseSessionLength, setPhraseSessionLength] = useState<VocabSessionLength>(20);
  const [selectedKanjiGroups, setSelectedKanjiGroups] = useState<Set<string>>(new Set());
  const [kanjiSessionLength, setKanjiSessionLength] = useState<VocabSessionLength>(10);
  const [selectedGrammarLessonId, setSelectedGrammarLessonId] = useState<string | null>(null);
  const [listeningSessionLength, setListeningSessionLength] = useState<VocabSessionLength>(20);
  const [selectedNumberGroups, setSelectedNumberGroups] = useState<Set<string>>(
    () => new Set(KEY_NUMBER_GROUPS.map((g) => g.id))
  );
  const [numberKeysLength, setNumberKeysLength] = useState<NumberKeysLength>(10);
  const [numberBuildLevel, setNumberBuildLevel] = useState<BuildLevel>("2cifras");
  const [dateTimeBuildLevel, setDateTimeBuildLevel] = useState<TimeBuildLevel>("hour");

  const {
    previewRows, pendingStartRef,
    sessionQueue, sessionIndexRef,
    currentMode, correctCount, missedList, current, input, setInput, feedback,
    choices, selectedOption,
    inputRef, nextBtnRef,
    launchSession, startSession, startWordSession,
    handleSubmit, handleProductionAnswer, handleProductionNext, handleWordContinue,
    reviewMisses,
  } = useSession({ progress, setProgress, streak, dailyProgress, persist, setView, sessionMode });

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Noto+Sans+JP:wght@500;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  /**
   * Deep link /compete/:code (docs/COMPETITION_PLAN.md, Fase B). Sin librería de
   * routing — se parsea el pathname una vez al montar, se guarda el código en
   * sessionStorage (useCompetition.stashInviteCode) para que sobreviva el
   * round-trip de login por OTP, y se navega a "competeJoin" de una vez —
   * esa vista ya sabe mostrar su propio prompt de login si todavía no hay
   * sesión, así que no hay que esperar a que resuelva el auth para navegar.
   */
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const base = import.meta.env.BASE_URL;
    const path = window.location.pathname;
    const rest = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\//, "");
    const match = rest.match(/^compete\/([A-Za-z0-9]+)$/);
    if (!match) return;
    stashInviteCode(match[1]);
    window.history.replaceState(null, "", base);
    setView("competeJoin");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session && pendingInviteCode) setView("competeJoin");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ── Setup helpers ─────────────────────────────────────────────────────────

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleVocabCategory(id: string) {
    setSelectedVocabCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePhraseCategory(id: string) {
    setSelectedPhraseCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleKanjiGroup(id: string) {
    setSelectedKanjiGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleNumberGroup(id: string) {
    setSelectedNumberGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePair(idx: number) {
    setSelectedPairs((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function toggleDakutenRow(id: string) {
    setSelectedDakutenRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCompoundRow(id: string) {
    setSelectedCompoundRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePhenomenon(id: string) {
    setSelectedPhenomena((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleKataRow(id: string) {
    setSelectedKataRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleKataDakutenRow(id: string) {
    setSelectedKataDakutenRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleKataCompoundRow(id: string) {
    setSelectedKataCompoundRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleKataPair(idx: number) {
    setSelectedKataPairs((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function isRowReady(rowId: string): boolean {
    return selectedRows.has(rowId) || selectedDakutenRows.has(rowId) || selectedCompoundRows.has(rowId) || rowStats(progress, rowId).mastered;
  }

  function isKataRowReady(rowId: string): boolean {
    return selectedKataRows.has(rowId) || selectedKataDakutenRows.has(rowId) || selectedKataCompoundRows.has(rowId)
      || rowStats(progress, rowId, KATAKANA_ALL_ROW_GROUPS).mastered;
  }

  function resetProgress() {
    const empty: ProgressItems = {};
    setProgress(empty);
    persist(empty, DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS);
    setResetConfirm(false);
    setView("home");
  }

  /** Handler compartido por todos los módulos de juego: fusiona el update y persiste. */
  function onProgressUpdate(updates: ProgressItems) {
    const merged = { ...progress, ...updates };
    setProgress(merged);
    persist(merged);
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const today           = toISODate();
  const poolForSelected = ALL_CHARS.filter((c) => selectedRows.has(c.row) || selectedDakutenRows.has(c.row) || selectedCompoundRows.has(c.row));
  const availableItems  = buildQueueItems(poolForSelected, sessionMode, poolForSelected.length * 2, progress, today);
  const masteredTotal   = ALL_CHARS.filter((c) => charStatus(progress, c.kana) === "mastered").length;

  const pairKanaSet     = new Set([...selectedPairs].flatMap((idx) => CONFUSED_PAIRS[idx]));
  const poolForPairs    = ALL_CHARS.filter((c) => pairKanaSet.has(c.kana));
  const availablePairItems = buildQueueItems(poolForPairs, "recognition", poolForPairs.length * 2, progress, today);

  const wordPool: CharWithRow[] = getAvailableWords(isRowReady)
    .map((w): CharWithRow => ({ kana: w.kana, romaji: w.romaji, row: "word" }));
  const availableWordItems = buildSessionQueue(wordPool, progress, "word", wordPool.length * 2, today);

  const poolForKataSelected = KATAKANA_ALL_CHARS.filter((c) => selectedKataRows.has(c.row) || selectedKataDakutenRows.has(c.row) || selectedKataCompoundRows.has(c.row));
  const availableKataItems  = buildQueueItems(poolForKataSelected, kataSessionMode, poolForKataSelected.length * 2, progress, today);
  const masteredKataTotal   = KATAKANA_ALL_CHARS.filter((c) => charStatus(progress, c.kana) === "mastered").length;

  const pairKataKanaSet     = new Set([...selectedKataPairs].flatMap((idx) => KATAKANA_CONFUSED_PAIRS[idx]));
  const poolForKataPairs    = KATAKANA_ALL_CHARS.filter((c) => pairKataKanaSet.has(c.kana));
  const availableKataPairItems = buildQueueItems(poolForKataPairs, "recognition", poolForKataPairs.length * 2, progress, today);

  const kataWordPool: CharWithRow[] = getAvailableKatakanaWords(isKataRowReady)
    .map((w): CharWithRow => ({ kana: w.kana, romaji: w.romaji, row: "word" }));
  const availableKataWordItems = buildSessionQueue(kataWordPool, progress, "word", kataWordPool.length * 2, today);

  const phoneticPool = getAvailablePhonetics(selectedPhenomena);

  const filteredVocabulary = selectedVocabCategories.size > 0
    ? VOCABULARY.filter((w) => selectedVocabCategories.has(w.category))
    : [];
  const { pool: vocabSessionPool, limit: vocabSessionLimit } = resolveVocabSession(filteredVocabulary, vocabSessionLength, progress);

  const filteredPhrases = selectedPhraseCategories.size > 0
    ? PHRASES.filter((p) => selectedPhraseCategories.has(p.category))
    : [];
  const { pool: phraseSessionPool, limit: phraseSessionLimit } = resolvePhraseSession(filteredPhrases, phraseSessionLength, progress);
  const masteredPhrasesTotal = PHRASES.filter((p) => phraseStatus(progress, p.id) === "mastered").length;

  const filteredKanji = selectedKanjiGroups.size > 0
    ? KANJI.filter((k) => selectedKanjiGroups.has(k.group))
    : [];
  const { pool: kanjiSessionPool, limit: kanjiSessionLimit } = resolveKanjiSession(filteredKanji, kanjiSessionLength, progress);
  const masteredKanjiTotal = KANJI.filter((k) => kanjiStatus(progress, k.kanji) === "mastered").length;

  const masteredGrammarTotal = GRAMMAR_LESSONS.filter((l) => grammarStatus(progress, l.id) === "mastered").length;
  const selectedGrammarLesson = GRAMMAR_LESSONS.find((l) => l.id === selectedGrammarLessonId) ?? null;

  const { pool: listeningSessionPool, limit: listeningSessionLimit } = resolveListeningSession(LISTENING_SENTENCES, listeningSessionLength, progress);
  const masteredListeningTotal = LISTENING_SENTENCES.filter((s) => listeningStatus(progress, s.id) === "mastered").length;

  const numberKeysPool = KEY_NUMBER_GROUPS
    .filter((g) => selectedNumberGroups.has(g.id))
    .flatMap((g) => g.numbers);
  const numberKeysLimit = numberKeysLength === "all" ? numberKeysPool.length : numberKeysLength;
  const numberBuildLevelDef = BUILD_LEVELS.find((l) => l.id === numberBuildLevel) ?? BUILD_LEVELS[0];
  const masteredNumberKeys = KEY_NUMBERS.filter((k) => numberKeyStatus(progress, k.value) === "mastered").length;

  const masteredDateTimeKeys =
    KEY_HOURS.filter((h) => hourKeyStatus(progress, h.value) === "mastered").length +
    KEY_MINUTE_UNITS.filter((m) => minuteKeyStatus(progress, m.value) === "mastered").length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-400">Cargando progreso…</div>;
  }

  return (
    <div className="min-h-screen bg-white text-stone-900 flex justify-center px-4 py-8">
      <ConfettiOverlay />
      <style>{`
        @keyframes stampIn { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .stamp-pop { animation: stampIn 0.35s ease-out; }
      `}</style>
      <div className="w-full max-w-xl">

        {/* ── Core: home / settings / metodología / stats / roadmap ── */}
        {["home", "settings", "methodology", "stats", "roadmap"].includes(view) && (
          <CoreViews
            view={view}
            setView={setView}
            progress={progress}
            streak={streak}
            dailyProgress={dailyProgress}
            today={today}
            masteredTotal={masteredTotal}
            masteredKataTotal={masteredKataTotal}
            masteredNumberKeys={masteredNumberKeys}
            masteredDateTimeKeys={masteredDateTimeKeys}
            masteredPhrasesTotal={masteredPhrasesTotal}
            masteredKanjiTotal={masteredKanjiTotal}
            masteredGrammarTotal={masteredGrammarTotal}
            masteredListeningTotal={masteredListeningTotal}
            saveError={saveError}
            resetConfirm={resetConfirm}
            setResetConfirm={setResetConfirm}
            resetProgress={resetProgress}
            exportProgress={exportProgress}
            importError={importError}
            pendingImport={pendingImport}
            importSuccess={importSuccess}
            stageImport={stageImport}
            confirmImport={confirmImport}
            cancelImport={cancelImport}
            session={session}
            authLoading={authLoading}
            otpStage={otpStage}
            otpError={otpError}
            pendingEmail={pendingEmail}
            cooldownSeconds={cooldownSeconds}
            requestCode={requestCode}
            verifyCode={verifyCode}
            cancelOtp={cancelOtp}
            signOut={signOut}
            pushNow={pushNow}
            syncing={syncing}
          />
        )}

        {/* ── Hiragana Setup ── */}
        {view === "hiraganaSetup" && (
          <HiraganaSetupView
            progress={progress}
            selectedRows={selectedRows} toggleRow={toggleRow} setSelectedRows={setSelectedRows}
            selectedDakutenRows={selectedDakutenRows} toggleDakutenRow={toggleDakutenRow} setSelectedDakutenRows={setSelectedDakutenRows}
            selectedCompoundRows={selectedCompoundRows} toggleCompoundRow={toggleCompoundRow} setSelectedCompoundRows={setSelectedCompoundRows}
            sessionMode={sessionMode} setSessionMode={setSessionMode}
            sessionLength={sessionLength} setSessionLength={setSessionLength}
            availableItems={availableItems} poolForSelected={poolForSelected}
            launchSession={launchSession} startSession={startSession}
            selectedPairs={selectedPairs} togglePair={togglePair}
            poolForPairs={poolForPairs} availablePairItems={availablePairItems}
            wordPool={wordPool} availableWordItems={availableWordItems} startWordSession={startWordSession}
            setView={setView}
          />
        )}

        {/* ── Katakana Setup ── */}
        {view === "katakanaSetup" && (
          <KatakanaSetupView
            progress={progress}
            selectedRows={selectedKataRows} toggleRow={toggleKataRow} setSelectedRows={setSelectedKataRows}
            selectedDakutenRows={selectedKataDakutenRows} toggleDakutenRow={toggleKataDakutenRow} setSelectedDakutenRows={setSelectedKataDakutenRows}
            selectedCompoundRows={selectedKataCompoundRows} toggleCompoundRow={toggleKataCompoundRow} setSelectedCompoundRows={setSelectedKataCompoundRows}
            sessionMode={kataSessionMode} setSessionMode={setKataSessionMode}
            sessionLength={kataSessionLength} setSessionLength={setKataSessionLength}
            availableItems={availableKataItems} poolForSelected={poolForKataSelected}
            launchSession={launchSession} startSession={startSession}
            selectedPairs={selectedKataPairs} togglePair={toggleKataPair}
            poolForPairs={poolForKataPairs} availablePairItems={availableKataPairItems}
            wordPool={kataWordPool} availableWordItems={availableKataWordItems} startWordSession={startWordSession}
            setView={setView}
          />
        )}

        {/* ── Preview / Quiz / Summary ── */}
        {(view === "preview" || view === "quiz" || view === "summary") && (
          <QuizView
            view={view}
            setView={setView}
            previewRows={previewRows}
            pendingStartRef={pendingStartRef}
            current={current}
            currentMode={currentMode}
            feedback={feedback}
            input={input}
            setInput={setInput}
            choices={choices}
            selectedOption={selectedOption}
            correctCount={correctCount}
            sessionQueue={sessionQueue}
            sessionIndexRef={sessionIndexRef}
            missedList={missedList}
            handleSubmit={handleSubmit}
            handleProductionAnswer={handleProductionAnswer}
            handleProductionNext={handleProductionNext}
            handleWordContinue={handleWordContinue}
            reviewMisses={reviewMisses}
            inputRef={inputRef}
            nextBtnRef={nextBtnRef}
            activeCompetitionId={activeCompetitionId}
            setActiveCompetitionId={setActiveCompetitionId}
          />
        )}

        {/* ── Fonética ── */}
        {(view === "phoneticSetup" || view === "phonetics") && (
          <PhoneticsModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            selectedPhenomena={selectedPhenomena}
            togglePhenomenon={togglePhenomenon}
            phoneticPool={phoneticPool}
          />
        )}

        {/* ── Vocabulario ── */}
        {(view === "vocabCategory" || view === "spellIt" || view === "recognizeIt" || view === "listenIt") && (
          <VocabModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            selectedVocabCategories={selectedVocabCategories}
            toggleVocabCategory={toggleVocabCategory}
            setSelectedVocabCategories={setSelectedVocabCategories}
            vocabSessionLength={vocabSessionLength}
            setVocabSessionLength={setVocabSessionLength}
            filteredVocabulary={filteredVocabulary}
            showRomaji={showRomaji}
            updateShowRomaji={updateShowRomaji}
            vocabSessionPool={vocabSessionPool}
            vocabSessionLimit={vocabSessionLimit}
          />
        )}

        {/* ── Frases ── */}
        {(view === "phraseSetup" || view === "phraseMeaning" || view === "phraseListening") && (
          <PhraseModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            selectedPhraseCategories={selectedPhraseCategories}
            togglePhraseCategory={togglePhraseCategory}
            setSelectedPhraseCategories={setSelectedPhraseCategories}
            phraseSessionLength={phraseSessionLength}
            setPhraseSessionLength={setPhraseSessionLength}
            filteredPhrases={filteredPhrases}
            phraseSessionPool={phraseSessionPool}
            phraseSessionLimit={phraseSessionLimit}
          />
        )}

        {/* ── Kanji ── */}
        {(view === "kanjiSetup" || view === "kanjiMeaning" || view === "kanjiReading" || view === "kanjiMatch") && (
          <KanjiModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            selectedKanjiGroups={selectedKanjiGroups}
            toggleKanjiGroup={toggleKanjiGroup}
            setSelectedKanjiGroups={setSelectedKanjiGroups}
            kanjiSessionLength={kanjiSessionLength}
            setKanjiSessionLength={setKanjiSessionLength}
            filteredKanji={filteredKanji}
            kanjiSessionPool={kanjiSessionPool}
            kanjiSessionLimit={kanjiSessionLimit}
          />
        )}

        {/* ── Gramática ── */}
        {(view === "grammarSetup" || view === "grammarLesson") && (
          <GrammarModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            setSelectedGrammarLessonId={setSelectedGrammarLessonId}
            selectedGrammarLesson={selectedGrammarLesson}
          />
        )}

        {/* ── Listening ── */}
        {(view === "listeningSetup" || view === "listeningComprehension" || view === "listeningDictation") && (
          <ListeningModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            listeningSessionLength={listeningSessionLength}
            setListeningSessionLength={setListeningSessionLength}
            listeningSessionPool={listeningSessionPool}
            listeningSessionLimit={listeningSessionLimit}
          />
        )}

        {/* ── Números ── */}
        {(view === "numberSetup" || view === "numberKeys" || view === "numberBuild" || view === "countIt") && (
          <NumberModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            selectedNumberGroups={selectedNumberGroups}
            toggleNumberGroup={toggleNumberGroup}
            numberKeysLength={numberKeysLength}
            setNumberKeysLength={setNumberKeysLength}
            numberBuildLevel={numberBuildLevel}
            setNumberBuildLevel={setNumberBuildLevel}
            numberKeysPool={numberKeysPool}
            numberKeysLimit={numberKeysLimit}
            numberBuildLevelDef={numberBuildLevelDef}
          />
        )}

        {/* ── Fechas y Horas ── */}
        {(view === "dateTimeSetup" || view === "dateTimeRecognize" || view === "dateTimeWrite" || view === "dateTimeBuild") && (
          <DateTimeModuleViews
            view={view}
            setView={setView}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
            dateTimeBuildLevel={dateTimeBuildLevel}
            setDateTimeBuildLevel={setDateTimeBuildLevel}
          />
        )}

        {/* ── Competir ── */}
        {(view === "competeHome" || view === "competeCreate" || view === "competeJoin" || view === "competeShare" || view === "competeResult" || view === "competePlayVocab" || view === "competePlayDateTime") && (
          <CompetitionModuleViews
            view={view}
            setView={setView}
            session={session}
            authLoading={authLoading}
            myCompetitions={myCompetitions}
            loadingCompetitions={loadingCompetitions}
            pendingInviteCode={pendingInviteCode}
            stashInviteCode={stashInviteCode}
            activeCompetitionId={activeCompetitionId}
            setActiveCompetitionId={setActiveCompetitionId}
            createCompetition={createCompetition}
            previewCompetition={previewCompetition}
            joinCompetition={joinCompetition}
            consumeInviteCode={consumeInviteCode}
            submitResult={submitResult}
            leaderboard={leaderboard}
            rivalHistories={rivalHistories}
            startSession={startSession}
            progress={progress}
            onProgressUpdate={onProgressUpdate}
          />
        )}

      </div>
    </div>
  );
}
