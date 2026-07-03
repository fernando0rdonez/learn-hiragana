import { useEffect, useRef } from "react";

const CONFETTI_EVENT = "confetti:fire";
const COLORS = ["#7B4FD4", "#9B7CE8", "#15C0A0", "#E85D3A", "#FFC93C", "#5533A8", "#FF6FA8"];

/** Dispara una ráfaga de confeti. Se puede llamar desde cualquier componente. */
export function fireConfetti() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  window.dispatchEvent(new Event(CONFETTI_EVENT));
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 0 | 1; // 0 = rectángulo, 1 = círculo
  gravity: number;
}

/** Overlay a pantalla completa que escucha CONFETTI_EVENT y dibuja las partículas. Montar una sola vez. */
export default function ConfettiOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const next: Particle[] = [];
      for (const p of particlesRef.current) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas!.height + 40) continue;

        next.push(p);
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        if (p.shape === 1) {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx!.restore();
      }
      particlesRef.current = next;

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    }

    function spawn() {
      const w = canvas!.width;
      for (let i = 0; i < 120; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: -20 - Math.random() * 100,
          vx: (Math.random() - 0.5) * 6,
          vy: 2 + Math.random() * 3,
          size: 6 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          shape: Math.random() > 0.5 ? 1 : 0,
          gravity: 0.12 + Math.random() * 0.08,
        });
      }
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    window.addEventListener(CONFETTI_EVENT, spawn);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener(CONFETTI_EVENT, spawn);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" aria-hidden="true" />;
}
