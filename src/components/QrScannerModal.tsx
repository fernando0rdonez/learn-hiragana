import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { X, Camera } from "lucide-react";
import { parseScannedInvite, type InviteKind, type ScannedInvite } from "../qrInvite";

const PURPLE      = "#7B4FD4";
const PURPLE_DARK = "#5533A8";

interface Props {
  /** Kind a bare code (no URL) is treated as — the screen the scanner was opened from. */
  fallbackKind: InviteKind;
  onResult: (invite: ScannedInvite) => void;
  onClose: () => void;
}

type CameraState = "starting" | "scanning" | "denied" | "unavailable";

// --- Decoding ---------------------------------------------------------------
// Native BarcodeDetector where available (Chrome Android); iOS Safari doesn't
// ship it, so we fall back to jsQR, lazily imported so it stays out of the
// main bundle. BarcodeDetector isn't in TypeScript's DOM lib yet.

interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
interface NativeBarcodeDetectorCtor {
  new (options: { formats: string[] }): NativeBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
}

type Decoder = (source: HTMLVideoElement | ImageBitmap) => Promise<string[]>;

// Downscale frames before handing them to jsQR — full-res camera frames are
// slow to scan on older phones and don't decode any better.
const MAX_DECODE_SIDE = 720;

async function createDecoder(): Promise<Decoder> {
  const Ctor = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorCtor }).BarcodeDetector;
  if (Ctor) {
    try {
      const formats = await Ctor.getSupportedFormats();
      if (formats.includes("qr_code")) {
        const detector = new Ctor({ formats: ["qr_code"] });
        return async (source) => (await detector.detect(source)).map((b) => b.rawValue);
      }
    } catch {
      // fall through to jsQR
    }
  }

  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (source) => {
    if (!ctx) return [];
    const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    if (!width || !height) return [];
    const scale = Math.min(1, MAX_DECODE_SIDE / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
    return result ? [result.data] : [];
  };
}

// --- Component --------------------------------------------------------------

const SCAN_INTERVAL_MS = 250;

/**
 * Full-screen camera scanner for invite QRs (docs/QR_JOIN_PLAN.md, Phase C).
 * Falls back to "take a photo" when live camera isn't available or allowed.
 */
export default function QrScannerModal({ fallbackKind, onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const decoderRef = useRef<Promise<Decoder> | null>(null);
  const doneRef = useRef(false);
  // Keep the latest callbacks without restarting the camera effect.
  const onResultRef = useRef(onResult);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onResultRef.current = onResult;
    onCloseRef.current = onClose;
  });

  const [camera, setCamera] = useState<CameraState>("starting");
  const [hint, setHint] = useState<string | null>(null);
  const [decodingPhoto, setDecodingPhoto] = useState(false);

  function getDecoder(): Promise<Decoder> {
    decoderRef.current ??= createDecoder();
    return decoderRef.current;
  }

  /** Returns true when an invite was found (and reported). */
  function handleDecoded(values: string[]): boolean {
    if (doneRef.current) return true;
    for (const value of values) {
      const invite = parseScannedInvite(value, fallbackKind);
      if (invite) {
        doneRef.current = true;
        onResultRef.current(invite);
        return true;
      }
    }
    if (values.length > 0) setHint("Ese QR no es una invitación de かな道.");
    return false;
  }

  // Camera + scan loop.
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setCamera(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // autoplay may reject on some browsers; the muted+playsInline video usually still renders
      }
      if (cancelled) return;
      setCamera("scanning");

      const decode = await getDecoder();
      const tick = async () => {
        if (cancelled || doneRef.current) return;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            if (handleDecoded(await decode(video))) return;
          } catch {
            // a single bad frame isn't worth surfacing; keep scanning
          }
        }
        if (!cancelled) timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS);
      };
      void tick();
    }

    void start();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // Runs once per open; callbacks are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same photo again
    if (!file) return;
    setDecodingPhoto(true);
    setHint(null);
    try {
      const bitmap = await createImageBitmap(file);
      const values = await (await getDecoder())(bitmap);
      bitmap.close();
      if (values.length === 0) setHint("No encontramos un QR en la foto. Intenta acercarte un poco más.");
      else handleDecoded(values);
    } catch {
      setHint("No pudimos leer la foto. Intenta de nuevo.");
    } finally {
      setDecodingPhoto(false);
    }
  }

  const cameraMessage =
    camera === "denied"
      ? "No tenemos permiso para usar la cámara. Actívalo en los ajustes del teléfono, o toma una foto del QR."
      : camera === "unavailable"
      ? "No pudimos abrir la cámara en este dispositivo. Puedes tomar una foto del QR."
      : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Escanear QR">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <span className="text-base font-bold">Escanear QR</span>
        <button onClick={onClose} aria-label="Cerrar" className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-white/5">
          {/* playsInline + muted are required for iOS to render inline instead of fullscreen. */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
            style={{ visibility: camera === "scanning" ? "visible" : "hidden" }}
          />
          {camera === "scanning" && <ViewfinderCorners />}
          {camera === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Abriendo cámara…</div>
          )}
          {cameraMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Camera size={32} className="text-white/60" />
              <p className="text-sm leading-relaxed text-white/80">{cameraMessage}</p>
            </div>
          )}
        </div>

        <p className="text-sm text-center mt-5 text-white/80 min-h-[2.5rem] max-w-[320px] text-balance">
          {hint ?? (camera === "scanning" ? "Apunta al QR de la invitación de tu amigo." : "")}
        </p>
      </div>

      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void handlePhoto(e)} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={decodingPhoto}
          className="w-full max-w-[320px] mx-auto flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold disabled:opacity-60"
          style={
            cameraMessage
              ? { background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, color: "#fff" }
              : { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }
          }
        >
          <Camera size={16} /> {decodingPhoto ? "Leyendo foto…" : "Tomar foto del QR"}
        </button>
      </div>
    </div>
  );
}

function ViewfinderCorners() {
  const corner = "absolute w-10 h-10 border-white";
  return (
    <div className="absolute inset-6 pointer-events-none" aria-hidden="true">
      <span className={`${corner} top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl`} />
      <span className={`${corner} top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl`} />
      <span className={`${corner} bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl`} />
      <span className={`${corner} bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl`} />
    </div>
  );
}
