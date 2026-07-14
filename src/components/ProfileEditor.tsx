import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { AVATAR_OPTIONS, DEFAULT_AVATAR_ID, avatarSrc } from "../avatars";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";
const BORDER      = "#EEEEEE";
const TEXT_MAIN   = "#1A1A2E";
const TEXT_SECOND = "#8B7FA8";

interface Props {
  myDisplayName: string | null;
  myAvatarId: string | null;
  updateProfile: (displayName: string, avatarId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

/** Fila compacta (avatar + nombre) que abre un popup para editar ambos — ver docs/BACKLOG.md (perfil de competencia). */
export default function ProfileEditor({ myDisplayName, myAvatarId, updateProfile }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Sincroniza una sola vez, cuando el perfil llega de Supabase — no debe
  // pisar lo que el usuario ya esté editando en ediciones posteriores.
  useEffect(() => {
    if (loadedRef.current || myDisplayName === null) return;
    loadedRef.current = true;
    setName(myDisplayName);
    setAvatarId(myAvatarId ?? DEFAULT_AVATAR_ID);
  }, [myDisplayName, myAvatarId]);

  const dirty = name.trim() !== (myDisplayName ?? "") || avatarId !== (myAvatarId ?? DEFAULT_AVATAR_ID);

  function handleOpen() {
    setError(null);
    setOpen(true);
  }

  function handleCancel() {
    // Descarta ediciones sin guardar, vuelve a los valores persistidos.
    setName(myDisplayName ?? "");
    setAvatarId(myAvatarId ?? DEFAULT_AVATAR_ID);
    setError(null);
    setOpen(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateProfile(name, avatarId);
    setSaving(false);
    if (result.ok) {
      setOpen(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 transition-colors"
      >
        <img src={avatarSrc(myAvatarId)} alt="" className="shrink-0 w-10 h-10 rounded-full object-cover" style={{ border: `1.5px solid ${BORDER}` }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: TEXT_MAIN }}>{myDisplayName || "Elige tu nombre"}</div>
          <div className="text-xs mt-0.5" style={{ color: TEXT_SECOND }}>Nombre y avatar</div>
        </div>
        <ChevronRight size={16} style={{ color: TEXT_SECOND }} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl px-5 pt-5 pb-7 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: TEXT_MAIN }}>Editar perfil</h3>
              <button onClick={handleCancel} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100" aria-label="Cerrar">
                <X size={16} style={{ color: TEXT_SECOND }} />
              </button>
            </div>

            <label className="text-xs font-semibold" style={{ color: TEXT_SECOND }}>Nombre público (lo ven tus rivales)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Tu nombre"
              className="w-full mt-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold border-[1.5px] outline-none"
              style={{ borderColor: BORDER, color: TEXT_MAIN }}
            />

            <div className="text-xs font-semibold mt-4 mb-2" style={{ color: TEXT_SECOND }}>Elige tu avatar</div>
            <div className="grid grid-cols-4 gap-2.5">
              {AVATAR_OPTIONS.map((opt) => {
                const selected = opt.id === avatarId;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatarId(opt.id)}
                    className="relative rounded-xl overflow-hidden aspect-square"
                    style={{ border: selected ? `2.5px solid ${PURPLE}` : `1.5px solid ${BORDER}` }}
                    aria-label={opt.label}
                    title={opt.label}
                  >
                    <img src={opt.src} alt={opt.label} className="w-full h-full object-cover" />
                    {selected && (
                      <span
                        className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: PURPLE }}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}

            <button
              onClick={() => void handleSave()}
              disabled={!dirty || saving || !name.trim()}
              className="w-full mt-5 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
            >
              {saving ? "Guardando…" : "Guardar perfil"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
