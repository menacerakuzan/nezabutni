"use client";

import { useEffect, useRef } from "react";

/**
 * Живий фон: теплі жарини свічок, що повільно здіймаються у темряві.
 * Абстрактне світло пам’яті — не імітація хроніки, не вигадані кадри.
 * Дуже стриманий рух; повністю зупиняється під prefers-reduced-motion.
 */
export function EmberCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface Ember {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      life: number;
      max: number;
    }
    let embers: Ember[] = [];

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(): Ember {
      const max = 5200 + Math.random() * 5000;
      return {
        x: Math.random() * w,
        y: h + Math.random() * 40,
        r: 0.6 + Math.random() * 1.8,
        vy: -(0.12 + Math.random() * 0.32),
        vx: (Math.random() - 0.5) * 0.16,
        life: 0,
        max,
      };
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < 46; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 0.6 + Math.random() * 1.6;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(223,155,59,${0.1 + Math.random() * 0.18})`;
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min(now - last, 48);
      last = now;
      ctx!.clearRect(0, 0, w, h);

      if (embers.length < 44 && Math.random() < 0.4) embers.push(spawn());

      for (const e of embers) {
        e.life += dt;
        e.y += e.vy * dt;
        e.x += e.vx * dt + Math.sin(e.life / 900) * 0.12;
        const t = e.life / e.max;
        const alpha = Math.sin(Math.min(t, 1) * Math.PI) * 0.5;
        ctx!.beginPath();
        const grad = ctx!.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 4);
        grad.addColorStop(0, `rgba(239,193,120,${alpha})`);
        grad.addColorStop(1, "rgba(239,193,120,0)");
        ctx!.fillStyle = grad;
        ctx!.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
        ctx!.fill();
      }
      embers = embers.filter((e) => e.life < e.max && e.y > -20);
      raf = requestAnimationFrame(frame);
    }

    resize();
    if (reduce) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`h-full w-full ${className}`} />;
}
