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
import { DEFAULT_STREAK, DEFAULT_DAILY_PROGRESS } from "./streak";
import { getAvailablePhonetics } from "./phonetics";
import VocabularyGame from "./components/VocabularyGame";
import VocabRecognizeGame from "./components/VocabRecognizeGame";
import VocabListeningGame from "./components/VocabListeningGame";
import VocabCountingGame from "./components/VocabCountingGame";
import NumberKeysGame from "./components/NumberKeysGame";
import NumberBuildGame from "./components/NumberBuildGame";
import PhoneticsDrill from "./components/PhoneticsDrill";
import ConfettiOverlay from "./components/ConfettiOverlay";
import { type ViewName, ALL_CHARS } from "./data";
import { KATAKANA_ALL_CHARS, KATAKANA_ALL_ROW_GROUPS } from "./dataKatakana";
import { toISODate, buildQueueItems, charStatus, rowStats, resolveVocabSession } from "./utils";
import { useProgress } from "./hooks/useProgress";
import { useStreak } from "./hooks/useStreak";
import { useSession } from "./hooks/useSession";
import HomeView from "./views/HomeView";
import StatsView from "./views/StatsView";
import VocabSetupView from "./views/VocabSetupView";
import NumberSetupView, { type NumberKeysLength } from "./views/NumberSetupView";
import type { BuildLevel } from "./numbers";
import { KEY_NUMBERS, KEY_NUMBER_GROUPS, BUILD_LEVELS, numberKeyStatus } from "./numbers";
import PhoneticSetupView from "./views/PhoneticSetupView";
import HiraganaSetupView from "./views/HiraganaSetupView";
import KatakanaSetupView from "./views/KatakanaSetupView";
import QuizView from "./views/QuizView";

// ── Component ──────────────────────────────────────────────────────────────

export default function HiraganaTrainer() {
  const { streak, setStreak, dailyProgress, setDailyProgress } = useStreak();
  const { loading, saveError, progress, setProgress, showRomaji, persist, updateShowRomaji } = useProgress({
    streak, dailyProgress, setStreak, setDailyProgress,
  });
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
  const [view, setView]             = useState<ViewName>("home");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [sessionMode, setSessionMode]   = useState<SessionMode>("recognition");
  const [sessionLength, setSessionLength] = useState<10 | 20 | "all">(20);
  const [selectedVocabCategories, setSelectedVocabCategories] = useState<Set<string>>(new Set());
  const [vocabSessionLength, setVocabSessionLength] = useState<VocabSessionLength>(20);
  const [selectedNumberGroups, setSelectedNumberGroups] = useState<Set<string>>(
    () => new Set(KEY_NUMBER_GROUPS.map((g) => g.id))
  );
  const [numberKeysLength, setNumberKeysLength] = useState<NumberKeysLength>(10);
  const [numberBuildLevel, setNumberBuildLevel] = useState<BuildLevel>("2cifras");

  const {
    previewRows, pendingStartRef,
    sessionQueue, sessionIndexRef,
    currentMode, correctCount, missedList, current, input, setInput, feedback,
    choices, selectedOption,
    inputRef, nextBtnRef,
    launchSession, startSession, startWordSession,
    handleSubmit, handleProductionAnswer, handleProductionNext,
    reviewMisses,
  } = useSession({ progress, setProgress, streak, dailyProgress, persist, setView, sessionMode });

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Noto+Sans+JP:wght@500;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

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

  const numberKeysPool = KEY_NUMBER_GROUPS
    .filter((g) => selectedNumberGroups.has(g.id))
    .flatMap((g) => g.numbers);
  const numberKeysLimit = numberKeysLength === "all" ? numberKeysPool.length : numberKeysLength;
  const numberBuildLevelDef = BUILD_LEVELS.find((l) => l.id === numberBuildLevel) ?? BUILD_LEVELS[0];
  const masteredNumberKeys = KEY_NUMBERS.filter((k) => numberKeyStatus(progress, k.value) === "mastered").length;

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

        {/* ── Home ── */}
        {view === "home" && (
          <HomeView
            streak={streak}
            masteredTotal={masteredTotal}
            masteredKataTotal={masteredKataTotal}
            masteredNumberKeys={masteredNumberKeys}
            saveError={saveError}
            resetConfirm={resetConfirm}
            setResetConfirm={setResetConfirm}
            resetProgress={resetProgress}
            setView={setView}
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
            showRomaji={showRomaji} updateShowRomaji={updateShowRomaji}
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
            reviewMisses={reviewMisses}
            inputRef={inputRef}
            nextBtnRef={nextBtnRef}
          />
        )}

        {/* ── Fonética: selector ── */}
        {view === "phoneticSetup" && (
          <PhoneticSetupView
            selectedPhenomena={selectedPhenomena}
            togglePhenomenon={togglePhenomenon}
            phoneticPool={phoneticPool}
            setView={setView}
          />
        )}

        {/* ── Fonética ── */}
        {view === "phonetics" && (
          <PhoneticsDrill
            phoneticWords={phoneticPool}
            progress={progress}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("home")}
          />
        )}

        {/* ── Vocabulario: selector de categoría ── */}
        {view === "vocabCategory" && (
          <VocabSetupView
            progress={progress}
            selectedVocabCategories={selectedVocabCategories}
            toggleVocabCategory={toggleVocabCategory}
            setSelectedVocabCategories={setSelectedVocabCategories}
            vocabSessionLength={vocabSessionLength}
            setVocabSessionLength={setVocabSessionLength}
            filteredVocabulary={filteredVocabulary}
            setView={setView}
          />
        )}

        {/* ── Vocabulario ── */}
        {view === "spellIt" && (
          <VocabularyGame
            vocabulary={vocabSessionPool}
            progress={progress}
            showRomaji={showRomaji}
            sessionLimit={vocabSessionLimit}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("home")}
          />
        )}

        {/* ── Vocabulario: reconocer ── */}
        {view === "recognizeIt" && (
          <VocabRecognizeGame
            vocabulary={vocabSessionPool}
            progress={progress}
            sessionLimit={vocabSessionLimit}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("home")}
          />
        )}

        {/* ── Vocabulario: escuchar ── */}
        {view === "listenIt" && (
          <VocabListeningGame
            vocabulary={vocabSessionPool}
            progress={progress}
            sessionLimit={vocabSessionLimit}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("home")}
          />
        )}

        {/* ── Números: selector ── */}
        {view === "numberSetup" && (
          <NumberSetupView
            progress={progress}
            selectedGroups={selectedNumberGroups}
            toggleGroup={toggleNumberGroup}
            keysLength={numberKeysLength}
            setKeysLength={setNumberKeysLength}
            buildLevel={numberBuildLevel}
            setBuildLevel={setNumberBuildLevel}
            setView={setView}
          />
        )}

        {/* ── Números: números clave (reconocer) ── */}
        {view === "numberKeys" && (
          <NumberKeysGame
            pool={numberKeysPool}
            progress={progress}
            sessionLimit={numberKeysLimit}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("numberSetup")}
          />
        )}

        {/* ── Números: formar el número ── */}
        {view === "numberBuild" && (
          <NumberBuildGame
            level={numberBuildLevelDef}
            progress={progress}
            sessionLimit={10}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("numberSetup")}
          />
        )}

        {/* ── Números: contar (objetos del vocabulario completo) ── */}
        {view === "countIt" && (
          <VocabCountingGame
            vocabulary={VOCABULARY}
            progress={progress}
            sessionLimit={10}
            onProgressUpdate={(updates) => {
              const merged = { ...progress, ...updates };
              setProgress(merged);
              persist(merged);
            }}
            onBack={() => setView("numberSetup")}
          />
        )}

        {/* ── Stats ── */}
        {view === "stats" && (
          <StatsView
            progress={progress}
            streak={streak}
            dailyProgress={dailyProgress}
            masteredTotal={masteredTotal}
            today={today}
            setView={setView}
          />
        )}

      </div>
    </div>
  );
}
