"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  color: string;
  w: number;
  h: number;
  life: number;
}

const COLORS = ["#b0926a", "#dcb87e", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

interface Props {
  /** When true, fires a burst. The component resets after the burst ends. */
  fire: boolean;
  /** Called once the burst is fully done so callers can reset their flag. */
  onDone?: () => void;
  /** Number of particles (default 120). */
  count?: number;
  /** Origin of the burst, in viewport percentages [0-1]. Default centered top. */
  originY?: number;
}

/**
 * Canvas-based confetti — one-off celebratory burst with no dependencies.
 * Stays under 3 KB gzipped because it draws simple rectangles.
 */
export function Confetti({ fire, onDone, count = 120, originY = 0.25 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    particlesRef.current = Array.from({ length: count }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 80,
      y: h * originY,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -14 - 4,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      life: 1,
    }));

    const GRAVITY = 0.35;
    const DRAG = 0.99;

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of particlesRef.current) {
        if (p.life <= 0) continue;
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > h + 20) {
          p.life = 0;
          continue;
        }
        p.life -= 0.004;
        alive++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (alive > 0) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = null;
        onDone?.();
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fire, count, originY, onDone]);

  if (!fire) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
