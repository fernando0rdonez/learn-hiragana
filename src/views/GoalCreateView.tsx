import { useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import type { ViewName } from "../data";
import type { GoalRow } from "../goals";
import {
  GOAL_DURATIONS, GOAL_PER_DAY_OPTIONS, GRAMMAR_BOOKS, MAX_GOAL_TASKS,
  goalTitle, newTaskId, validateTasks,
  type GoalDuration, type GoalModule, type GoalTarget, type GoalTask,
} from "../goals";
import { GRAMMAR_LESSONS, type GrammarBook } from "../grammar";
import { VOCAB_CATEGORIES } from "../vocabulary";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";
const BORDER      = "#EEEEEE";

const MODULE_LABELS: Record<GoalModule, string> = {
  grammar: "Gramática",
  vocab: "Vocabulario",
  hiragana: "Hiragana",
};

interface Props {
  setView: (v: ViewName) => void;
  createGoal: (tasks: GoalTask[], durationDays: GoalDuration) => Promise<{ ok: true; goal: GoalRow } | { ok: false; error: string }>;
  onCreated: (goal: GoalRow) => void;
}

// <select> values: "any" | "book:<GrammarBook>" | "lesson:<id>" | "cat:<id>"
function targetToValue(target: GoalTarget): string {
  if (target.lessonId) return `lesson:${target.lessonId}`;
  if (target.book) return `book:${target.book}`;
  if (target.category) return `cat:${target.category}`;
  return "any";
}

function valueToTarget(value: string): GoalTarget {
  const [kind, ...rest] = value.split(":");
  const id = rest.join(":");
  if (kind === "lesson") return { lessonId: id };
  if (kind === "book") return { book: id as GrammarBook };
  if (kind === "cat") return { category: id };
  return {};
}

function emptyTask(module: GoalModule = "grammar"): GoalTask {
  return { id: newTaskId(), module, target: {}, perDay: 1 };
}

export default function GoalCreateView({ setView, createGoal, onCreated }: Props) {
  const [tasks, setTasks] = useState<GoalTask[]>([emptyTask()]);
  const [duration, setDuration] = useState<GoalDuration>(7);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = validateTasks(tasks);

  function updateTask(id: string, patch: Partial<GoalTask>) {
    setError(null);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTask() {
    setError(null);
    // Default to the first module not used yet, so the new task doesn't start as a duplicate.
    const used = new Set(tasks.map((t) => t.module));
    const next = (Object.keys(MODULE_LABELS) as GoalModule[]).find((m) => !used.has(m)) ?? "grammar";
    setTasks((prev) => [...prev, emptyTask(next)]);
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const result = await createGoal(tasks, duration);
    setCreating(false);
    if (result.ok) onCreated(result.goal);
    else setError(result.error);
  }

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setView("goalHome")} className="flex items-center gap-1 text-sm hover:opacity-70" style={{ color: TEXT_SECOND }}>
          <ArrowLeft size={14} /> Metas
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: TEXT_MAIN }}>Crear meta</h1>
      <p className="text-sm mb-5" style={{ color: TEXT_SECOND }}>Qué tiene que estudiar cada persona, cada día.</p>

      <div className="text-[11px] font-bold uppercase tracking-wide mb-2.5" style={{ color: TEXT_SECOND }}>Tareas diarias</div>
      {tasks.map((task, i) => (
        <TaskEditor
          key={task.id}
          index={i}
          task={task}
          canRemove={tasks.length > 1}
          onChange={(patch) => updateTask(task.id, patch)}
          onRemove={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
        />
      ))}
      {tasks.length < MAX_GOAL_TASKS && (
        <button
          onClick={addTask}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold border-[1.5px] border-dashed"
          style={{ borderColor: "#D9CCF3", color: PURPLE }}
        >
          <Plus size={15} /> Agregar tarea
        </button>
      )}

      <div className="text-[11px] font-bold uppercase tracking-wide mt-6 mb-2.5" style={{ color: TEXT_SECOND }}>Duración</div>
      <div className="flex gap-2">
        {GOAL_DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className="flex-1 text-center rounded-xl py-2.5 text-sm font-bold border-[1.5px]"
            style={duration === d ? { borderColor: PURPLE, backgroundColor: "#F7F3FD", color: PURPLE } : { borderColor: BORDER, color: TEXT_SECOND }}
          >
            {d} días
          </button>
        ))}
      </div>
      <p className="text-xs mt-2 leading-relaxed" style={{ color: TEXT_SECOND }}>
        Empieza hoy. Un día cuenta como cumplido cuando completas todas las tareas.
      </p>

      <div className="rounded-2xl p-4 mt-6" style={{ backgroundColor: "#F9F8FC" }}>
        <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: TEXT_SECOND }}>Tu meta</div>
        <div className="text-sm font-bold" style={{ color: TEXT_MAIN }}>{goalTitle(tasks)}</div>
        <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>Cada día durante {duration} días</div>
      </div>

      {(error || validationError) && (
        <p className="text-sm mt-4" style={{ color: "#E2503F" }}>{error ?? validationError}</p>
      )}

      <button
        onClick={() => void handleCreate()}
        disabled={creating || !!validationError}
        className="w-full mt-5 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        {creating ? "Creando…" : "Crear meta"}
      </button>
    </div>
  );
}

interface TaskEditorProps {
  index: number;
  task: GoalTask;
  canRemove: boolean;
  onChange: (patch: Partial<GoalTask>) => void;
  onRemove: () => void;
}

function TaskEditor({ index, task, canRemove, onChange, onRemove }: TaskEditorProps) {
  return (
    <div className="rounded-2xl p-3.5 mb-2.5 border-[1.5px]" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold" style={{ color: TEXT_MAIN }}>Tarea {index + 1}</span>
        {canRemove && (
          <button onClick={onRemove} aria-label={`Quitar tarea ${index + 1}`} className="p-1 -m-1 hover:opacity-70" style={{ color: TEXT_SECOND }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(Object.keys(MODULE_LABELS) as GoalModule[]).map((m) => (
          <button
            key={m}
            onClick={() => onChange({ module: m, target: {} })}
            className="rounded-xl py-2 text-xs font-bold border-[1.5px]"
            style={task.module === m ? { borderColor: PURPLE, backgroundColor: "#F7F3FD", color: PURPLE } : { borderColor: BORDER, color: TEXT_SECOND }}
          >
            {MODULE_LABELS[m]}
          </button>
        ))}
      </div>

      {task.module !== "hiragana" && (
        <select
          value={targetToValue(task.target)}
          onChange={(e) => onChange({ target: valueToTarget(e.target.value) })}
          aria-label={task.module === "grammar" ? "Lección de gramática" : "Categoría de vocabulario"}
          className="w-full mt-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold border-[1.5px] bg-white outline-none"
          style={{ borderColor: BORDER, color: TEXT_MAIN }}
        >
          {task.module === "grammar" ? (
            <>
              <option value="any">Cualquier lección</option>
              <optgroup label="Libro completo">
                {GRAMMAR_BOOKS.map((b) => <option key={b} value={`book:${b}`}>{b}</option>)}
              </optgroup>
              {GRAMMAR_BOOKS.map((b) => (
                <optgroup key={b} label={b}>
                  {GRAMMAR_LESSONS.filter((l) => l.section === b).map((l) => (
                    <option key={l.id} value={`lesson:${l.id}`}>{l.title}</option>
                  ))}
                </optgroup>
              ))}
            </>
          ) : (
            <>
              <option value="any">Cualquier categoría</option>
              {VOCAB_CATEGORIES.map((c) => <option key={c.id} value={`cat:${c.id}`}>{c.emoji} {c.label}</option>)}
            </>
          )}
        </select>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        <span className="text-xs font-semibold flex-1" style={{ color: TEXT_SECOND }}>Sesiones por día</span>
        {GOAL_PER_DAY_OPTIONS.map((n) => (
          <button
            key={n}
            onClick={() => onChange({ perDay: n })}
            aria-label={`${n} por día`}
            className="w-9 h-9 rounded-xl text-sm font-bold border-[1.5px]"
            style={task.perDay === n ? { borderColor: PURPLE, backgroundColor: "#F7F3FD", color: PURPLE } : { borderColor: BORDER, color: TEXT_SECOND }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
