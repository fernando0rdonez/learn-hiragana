import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { AVATAR_OPTIONS, DEFAULT_AVATAR_ID } from "../avatars";

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

export default function ProfileEditor({ myDisplayName, myAvatarId, updateProfile }: Props) {
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const loadedRef = useRef(false);

  // Sincroniza una sola vez, cuando el perfil llega de Supabase — no debe
  // pisar lo que el usuario ya esté editando en ediciones posteriores.
  useEffect(() => {
    if (loadedRef.current || myDisplayName === null) return;
    loadedRef.current = true;
    setName(myDisplayName);
    setAvatarId(myAvatarId ?? DEFAULT_AVATAR_ID);
  }, [myDisplayName, myAvatarId]);

  const dirty = loadedRef.current && (name.trim() !== myDisplayName || avatarId !== (myAvatarId ?? DEFAULT_AVATAR_ID));

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateProfile(name, avatarId);
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error);
    }
  }

  return (
    <div>
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
        className="w-full mt-4 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` }}
      >
        {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar perfil"}
      </button>
    </div>
  );
}
