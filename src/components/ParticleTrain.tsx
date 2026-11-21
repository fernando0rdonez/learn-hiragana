import { PARTICLE_TRAIN, TRAIN_MNEMONIC, particleColor, type TrainStation } from "../particleTrain";

interface Props {
  /** Lección actual: su estación se resalta. */
  currentLessonId?: string;
  /** Si se pasa, las estaciones no desbloqueadas se muestran atenuadas. */
  isUnlocked?: (station: TrainStation) => boolean;
  compact?: boolean;
  showMnemonic?: boolean;
}

const VERB_COLOR = { fg: "#1A1A2E", bg: "#F3F1F8" };

/**
 * Tren de partículas: (tema)は → (tiempo)に → (comp)と → (medio)で → へ/を → VERBO.
 * Desplazable en horizontal dentro de su propia caja para que nunca desborde la página.
 */
export default function ParticleTrain({ currentLessonId, isUnlocked, compact = false, showMnemonic = false }: Props) {
  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto pb-1">
        <div className="flex items-stretch gap-1 w-max mx-auto">
          {PARTICLE_TRAIN.map((st, i) => {
            const isVerb = st.particles.length === 0;
            const color = isVerb ? VERB_COLOR : particleColor(st.particles[0]) ?? VERB_COLOR;
            const unlocked = isUnlocked ? isUnlocked(st) : true;
            const current = !!currentLessonId && st.lessonIds.includes(currentLessonId);
            return (
              <div key={st.role} className="flex items-center gap-1">
                <div
                  className={`rounded-xl border-2 text-center flex flex-col items-center justify-center transition-opacity ${compact ? "px-2 py-1 min-w-[3.25rem]" : "px-2.5 py-2 min-w-[4.5rem]"}`}
                  style={{
                    backgroundColor: color.bg,
                    borderColor: current ? color.fg : "transparent",
                    opacity: unlocked ? 1 : 0.35,
                    boxShadow: current ? `0 0 0 2px ${color.bg}` : undefined,
                  }}
                  title={`${st.role}: ${st.question} (${st.ask})`}
                >
                  <div
                    className={`font-bold leading-none ${compact ? "text-base" : "text-xl"}`}
                    style={{ color: color.fg, fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    {isVerb ? "Verbo" : st.particles.join("/")}
                  </div>
                  <div className={`font-semibold mt-1 ${compact ? "text-[9px]" : "text-[10px]"}`} style={{ color: color.fg }}>
                    {st.role}
                  </div>
                  {!compact && (
                    <>
                      <div className="text-[10px] mt-0.5" style={{ color: "#5B5470" }}>{st.question}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: "#8B7FA8", fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {st.ask}
                      </div>
                      {st.extra && (
                        <div className="text-[10px] mt-0.5 font-medium" style={{ color: particleColor("から")?.fg, fontFamily: "'Noto Sans JP', sans-serif" }}>
                          o {st.extra}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {i < PARTICLE_TRAIN.length - 1 && (
                  <span className="text-xs shrink-0" style={{ color: "#C9C2DA" }} aria-hidden>▶</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {showMnemonic && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: "#5B5470" }}>
          🐊 {TRAIN_MNEMONIC}
        </p>
      )}
    </div>
  );
}
