"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { generateDemoLights, type DemoLight } from "../../lib/demo-names";
import { OUTLINE, CITIES } from "../../lib/odesa-geo";

/**
 * Поле вогнів над Одеською областю. Справжній контур регіону
 * (geoBoundaries ADM1), реальні міста, Чорне море — і вогник за кожним
 * ім’ям. Одне полотно — головна, реєстр і навігація.
 *
 * Продуктивність: сяйво вогнів малюється одним пре-рендереним спрайтом
 * (drawImage), а не сотнями радіальних градієнтів на кадр.
 */

export interface RealLight {
  pid: string;
  name: string;
  years: string;
  region: string | null;
}

interface Light {
  id: string;
  pid?: string;
  name: string;
  years: string;
  cluster: string;
  x: number;
  y: number;
  demo: boolean;
  phase: number;
  size: number;
}

interface Cam {
  x: number;
  y: number;
  z: number;
}

const MIN_Z = 0.8;
const MAX_Z = 14;
const NAME_Z = 5.2;
const FIELD_CX = 0.34; // центр контуру по x (поле нормоване 0..~0.67 × 0..1)

/** Пре-рендер спрайта сяйва: тепле ядро + м’який ореол. */
function makeGlowSprite(warm: boolean): HTMLCanvasElement {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const rgb = warm ? "255,214,140" : "239,193,120";
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.3, `rgba(${rgb},0.38)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return c;
}

export function FieldOfLights({ real }: { real: RealLight[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<Cam>({ x: FIELD_CX, y: 0.5, z: 0.9 });
  const targetRef = useRef<Cam>({ x: FIELD_CX, y: 0.5, z: 0.9 });
  const dragRef = useRef<{ px: number; py: number; moved: boolean } | null>(null);
  const hoverRef = useRef<Light | null>(null);
  const rafRef = useRef(0);
  const reduceRef = useRef(false);

  const [selected, setSelected] = useState<Light | null>(null);
  const [query, setQuery] = useState("");
  const [immersed, setImmersed] = useState(false);
  const immersedRef = useRef(false);
  const queryRef = useRef("");
  queryRef.current = query.trim().toLowerCase();

  const lights = useMemo<Light[]>(() => {
    const demo = generateDemoLights(420).map((d: DemoLight, i: number) => ({
      ...d,
      phase: (i * 137.5) % (Math.PI * 2),
      size: 1,
    }));
    // реальні записи — біля Одеси, трохи більші
    const odesa = CITIES[0]!;
    const reals = real.map((r, i) => ({
      id: `real-${r.pid}`,
      pid: r.pid,
      name: r.name,
      years: r.years,
      cluster: r.region ?? odesa.name,
      x: odesa.x + Math.cos(i * 2.1 + 0.7) * 0.028 * (1 + (i % 3) * 0.5),
      y: odesa.y + Math.sin(i * 2.7 + 0.4) * 0.024 * (1 + (i % 2) * 0.6),
      demo: false,
      phase: i * 1.7,
      size: 1.7,
    }));
    return [...demo, ...reals];
  }, [real]);

  const total = lights.length;

  const toScreen = useCallback((l: { x: number; y: number }, cam: Cam, w: number, h: number) => {
    const s = Math.min(w, h) * cam.z;
    return { x: w / 2 + (l.x - cam.x) * s, y: h / 2 + (l.y - cam.y) * s };
  }, []);
  const toWorld = useCallback((sx: number, sy: number, cam: Cam, w: number, h: number) => {
    const s = Math.min(w, h) * cam.z;
    return { x: cam.x + (sx - w / 2) / s, y: cam.y + (sy - h / 2) / s };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // перф: 1.5 достатньо для вогнів
    const spriteWarm = makeGlowSprite(true);
    const spriteBase = makeGlowSprite(false);

    // пре-рендерена крапкова текстура суші
    const patCanvas = document.createElement("canvas");
    patCanvas.width = 22;
    patCanvas.height = 22;
    const pg = patCanvas.getContext("2d")!;
    pg.fillStyle = "rgba(251,243,233,0.055)";
    pg.fillRect(4, 4, 1, 1);
    pg.fillRect(15, 11, 1, 1);
    pg.fillRect(9, 18, 1, 1);
    const landPattern = ctx.createPattern(patCanvas, "repeat")!;
    let w = 0;
    let h = 0;
    let placedCamera = false;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!placedCamera) {
        // мапа праворуч від титрів на широких екранах
        const shift = w > h ? 0.1 * (w / h - 1) : 0;
        camRef.current.x = FIELD_CX - shift;
        targetRef.current.x = FIELD_CX - shift;
        placedCamera = true;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let t0 = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - t0, 50) / 1000;
      t0 = now;
      const cam = camRef.current;
      const tgt = targetRef.current;
      const k = 1 - Math.exp(-dt * 5.5);
      cam.x += (tgt.x - cam.x) * k;
      cam.y += (tgt.y - cam.y) * k;
      cam.z += (tgt.z - cam.z) * k;

      const deep = cam.z > 3;
      if (deep !== immersedRef.current) {
        immersedRef.current = deep;
        setImmersed(deep);
      }

      // ── ніч і море: глибокий вертикальний градієнт ──
      const seaGrad = ctx.createLinearGradient(0, 0, 0, h);
      seaGrad.addColorStop(0, "#07080C");
      seaGrad.addColorStop(0.55, "#080B12");
      seaGrad.addColorStop(1, "#0A1220");
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, w, h);

      // ── суходіл: багатошарова картографічна подача ──
      const tracePath = () => {
        ctx.beginPath();
        for (let i = 0; i < OUTLINE.length; i++) {
          const p = toScreen({ x: OUTLINE[i]![0], y: OUTLINE[i]![1] }, cam, w, h);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
      };

      // 1) зовнішнє мʼяке світіння берегової лінії (глибина)
      tracePath();
      ctx.strokeStyle = "rgba(150,180,220,0.05)";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = "rgba(150,180,220,0.07)";
      ctx.lineWidth = 4;
      ctx.stroke();

      // 2) заливка суші: теплий градієнт з півночі на південь
      tracePath();
      const landTop = toScreen({ x: 0.33, y: 0 }, cam, w, h).y;
      const landBot = toScreen({ x: 0.33, y: 1 }, cam, w, h).y;
      const landGrad = ctx.createLinearGradient(0, landTop, 0, landBot);
      landGrad.addColorStop(0, "rgba(251,243,233,0.045)");
      landGrad.addColorStop(0.6, "rgba(251,243,233,0.028)");
      landGrad.addColorStop(1, "rgba(223,155,59,0.03)");
      ctx.fillStyle = landGrad;
      ctx.fill();

      // 3) текстура суші: рідкий пунктирний растр (пре-рендерений патерн)
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = landPattern;
      const off = (cam.x * 40) % 22;
      const offY = (cam.y * 40) % 22;
      ctx.translate(-off, -offY);
      ctx.fillRect(-22, -22, w + 44, h + 44);
      ctx.globalAlpha = 1;
      ctx.restore();

      // 4) подвійний контур: тонкий основний + віддалена внутрішня лінія
      tracePath();
      ctx.strokeStyle = "rgba(251,243,233,0.22)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      tracePath();
      ctx.strokeStyle = "rgba(251,243,233,0.05)";
      ctx.lineWidth = 5;
      ctx.stroke();

      const time = now / 1000;
      const q = queryRef.current;
      const hover = hoverRef.current;
      const showNames = cam.z >= NAME_Z;

      // велика тиха назва області поверх суші (лише на віддалі)
      if (cam.z < 1.6) {
        const t = toScreen({ x: 0.31, y: 0.3 }, cam, w, h);
        ctx.font = "600 30px var(--font-odesa), sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(251,243,233,${0.1 * (1.6 - cam.z) * 2.2})`;
        ctx.fillText("ОДЕСЬКА ОБЛАСТЬ", t.x, t.y);
        ctx.textAlign = "left";
      }

      // ── міста ──
      ctx.textAlign = "left";
      for (const c of CITIES) {
        const visible = c.tier === 1 || (c.tier === 2 && cam.z > 1.35) || cam.z > 2.4;
        if (!visible) continue;
        const p = toScreen(c, cam, w, h);
        if (p.x < -80 || p.x > w + 80 || p.y < -20 || p.y > h + 20) continue;
        const a = c.tier === 1 ? 0.78 : 0.5;
        ctx.fillStyle = `rgba(251,243,233,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, c.tier === 1 ? 2.6 : 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${c.tier === 1 ? 600 : 500} ${c.tier === 1 ? 13 : 11.5}px var(--font-odesa), sans-serif`;
        // підкладка для читабельності поверх вогнів
        ctx.strokeStyle = "rgba(7,8,12,0.75)";
        ctx.lineWidth = 3;
        ctx.strokeText(c.name, p.x + 8, p.y + 4);
        ctx.fillStyle = `rgba(251,243,233,${a})`;
        ctx.fillText(c.name, p.x + 8, p.y + 4);
      }

      // море: підпис + легкі лінії хвиль
      if (cam.z < 3.4) {
        const sea = toScreen({ x: 0.53, y: 0.84 }, cam, w, h);
        ctx.font = "500 13px var(--font-odesa), sans-serif";
        ctx.fillStyle = "rgba(130,160,200,0.42)";
        ctx.fillText("Чорне море", sea.x, sea.y);
        ctx.strokeStyle = "rgba(130,160,200,0.1)";
        ctx.lineWidth = 1;
        for (let i = 1; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(sea.x - 8, sea.y + 8 * i + 4);
          ctx.lineTo(sea.x + 76 - i * 18, sea.y + 8 * i + 4);
          ctx.stroke();
        }
      }

      // ── вогні (спрайтами) ──
      for (const l of lights) {
        const p = toScreen(l, cam, w, h);
        if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) continue;

        const matches = q.length >= 2 && l.name.toLowerCase().includes(q);
        const dimmed = q.length >= 2 && !matches;
        const isHover = hover?.id === l.id;
        const isSel = selected?.id === l.id;

        const flicker = reduceRef.current
          ? 1
          : 0.82 + 0.18 * Math.sin(time * (1.4 + (l.phase % 1)) + l.phase);
        const base = (1.1 + cam.z * 0.42) * l.size * (isHover || isSel ? 1.9 : 1);
        const alpha = dimmed ? 0.08 : (l.demo ? 0.72 : 0.95) * flicker;
        const sprite = matches || isHover || isSel ? spriteWarm : spriteBase;
        const R = base * 5;

        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, p.x - R, p.y - R, R * 2, R * 2);
        ctx.globalAlpha = Math.min(1, alpha + 0.15);
        ctx.fillStyle = "#FFF6E6";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, base * 0.8), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if ((showNames && !dimmed) || matches || isHover || isSel) {
          const nameAlpha =
            isHover || isSel || matches ? 0.95 : Math.min(0.75, (cam.z - NAME_Z) * 0.28 + 0.2);
          if (nameAlpha > 0.05) {
            ctx.font = `${isHover || isSel ? 600 : 400} ${isHover || isSel ? 13 : 12}px var(--font-odesa), sans-serif`;
            ctx.fillStyle = `rgba(251,243,233,${nameAlpha})`;
            ctx.fillText(l.name, p.x + base * 4 + 6, p.y + 4);
          }
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    // перф: зупиняємо цикл, коли поле поза вʼюпортом
    let running = true;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0]?.isIntersecting ?? true;
        if (vis && !running) {
          running = true;
          t0 = performance.now();
          rafRef.current = requestAnimationFrame(frame);
        } else if (!vis && running) {
          running = false;
          cancelAnimationFrame(rafRef.current);
        }
      },
      { threshold: 0.02 }
    );
    io.observe(wrap);

    const nearest = (sx: number, sy: number): Light | null => {
      const cam = camRef.current;
      let best: Light | null = null;
      let bestD = 24;
      for (const l of lights) {
        const p = toScreen(l, cam, w, h);
        const d = Math.hypot(p.x - sx, p.y - sy);
        if (d < bestD) {
          bestD = d;
          best = l;
        }
      }
      return best;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const tgt = targetRef.current;
      const before = toWorld(sx, sy, tgt, w, h);
      tgt.z = Math.min(MAX_Z, Math.max(MIN_Z, tgt.z * Math.exp(-e.deltaY * 0.0016)));
      const after = toWorld(sx, sy, tgt, w, h);
      tgt.x += before.x - after.x;
      tgt.y += before.y - after.y;
    };
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = { px: e.clientX, py: e.clientY, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.px;
        const dy = e.clientY - dragRef.current.py;
        if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
        dragRef.current.px = e.clientX;
        dragRef.current.py = e.clientY;
        const s = Math.min(w, h) * targetRef.current.z;
        targetRef.current.x -= dx / s;
        targetRef.current.y -= dy / s;
        camRef.current.x = targetRef.current.x;
        camRef.current.y = targetRef.current.y;
      } else {
        hoverRef.current = nearest(sx, sy);
        canvas.style.cursor = hoverRef.current ? "pointer" : "grab";
      }
    };
    const onUp = (e: PointerEvent) => {
      const wasDrag = dragRef.current?.moved;
      dragRef.current = null;
      if (wasDrag) return;
      const rect = canvas.getBoundingClientRect();
      const hit = nearest(e.clientX - rect.left, e.clientY - rect.top);
      if (hit) {
        setSelected(hit);
        targetRef.current = { x: hit.x + 0.02, y: hit.y, z: Math.max(targetRef.current.z, 7.5) };
      } else {
        setSelected(null);
      }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [lights, selected, toScreen, toWorld]);

  const zoomBy = (f: number) => {
    const t = targetRef.current;
    t.z = Math.min(MAX_Z, Math.max(MIN_Z, t.z * f));
  };
  const reset = () => {
    targetRef.current = { x: camRef.current.x, y: 0.5, z: 0.9 };
    setSelected(null);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative h-[100dvh] w-full overflow-hidden bg-[#08090D]">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab"
        aria-label="Поле вогнів пам’яті над мапою Одеської області"
      />

      {/* Вступний титр */}
      <div
        className={`pointer-events-none absolute left-6 top-24 max-w-md transition-opacity duration-700 md:left-10 md:top-32 ${
          immersed ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="caption">Одеська область · поле вогнів</span>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.0] text-cream md:text-6xl">
          Кожен вогник — <span className="text-gold">людина</span>.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink md:text-base">
          {total} вогнів пам’яті на мапі області. Наблизьтеся — вогні стануть іменами. Торкніться
          вогника — увійдіть до історії.
        </p>
      </div>

      {/* Пошук */}
      <div className="absolute right-6 top-24 w-64 md:right-10 md:top-32">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Знайти ім’я у полі…"
          aria-label="Пошук імені у полі вогнів"
          className="w-full border-0 border-b border-hair bg-transparent px-1 py-2.5 text-sm text-cream placeholder:text-ink-faint focus:border-gold/60 focus:outline-none"
        />
        {query.trim().length >= 2 && (
          <p className="mt-2 text-xs text-ink-lo">
            Збіги світяться яскравіше.{" "}
            <button onClick={() => setQuery("")} className="text-gold">
              Скинути
            </button>
          </p>
        )}
      </div>

      {/* Керування */}
      <div className="absolute bottom-24 right-6 flex flex-col gap-px overflow-hidden rounded-[3px] border border-hair md:right-10">
        <button onClick={() => zoomBy(1.45)} aria-label="Наблизити" className="h-10 w-10 bg-[#0B0E14] text-lg text-cream transition-colors hover:bg-[#141926]">+</button>
        <button onClick={() => zoomBy(1 / 1.45)} aria-label="Віддалити" className="h-10 w-10 bg-[#0B0E14] text-lg text-cream transition-colors hover:bg-[#141926]">−</button>
        <button onClick={reset} aria-label="Показати всю область" className="h-10 w-10 bg-[#0B0E14] text-xs text-cream transition-colors hover:bg-[#141926]">⌂</button>
      </div>

      {/* Легенда мапи */}
      <div
        className={`pointer-events-none absolute bottom-24 left-6 transition-opacity duration-700 md:left-10 ${
          immersed ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="rounded-[3px] border border-hair bg-[#0A0C12]/90 px-4 py-3">
          <p className="text-xs font-medium text-cream">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold align-middle shadow-[0_0_6px_rgba(223,155,59,0.9)]" />
            Один вогник — одна людина
          </p>
          <p className="mt-1 text-xs text-ink-lo">Мапа Одеської області · вогні над рідними містами</p>
        </div>
        <p className="mt-3 text-xs text-ink-lo">Тягніть, щоб рухатися мапою · колесо — наближення</p>
      </div>
      {immersed && (
        <p className="pointer-events-none absolute bottom-24 left-6 text-xs text-ink-lo md:left-10">
          Торкніться вогника, щоб відкрити історію
        </p>
      )}

      {/* Панель вогника */}
      {selected && (
        <aside className="absolute bottom-40 left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-[4px] border border-hair-strong bg-[#0B0F16] p-6 md:bottom-auto md:left-auto md:right-10 md:top-1/2 md:-translate-y-1/2 md:translate-x-0">
          <button
            onClick={() => setSelected(null)}
            aria-label="Закрити"
            className="absolute right-4 top-4 text-ink-lo transition-colors hover:text-cream"
          >
            ✕
          </button>
          <span className="caption">{selected.demo ? "Вогник пам’яті" : "Сторінка пам’яті"}</span>
          <h2 className="mt-3 font-display text-2xl font-semibold uppercase leading-tight text-cream">
            {selected.name}
          </h2>
          <p className="mt-2 text-sm text-ink">
            {selected.years} · {selected.cluster}
          </p>
          {selected.demo ? (
            <p className="mt-4 border-t border-hair pt-4 text-sm text-ink-lo">
              Історія цього вогника ще збирається. Демонстраційне ім’я — воно показує, яким стане
              поле, коли родини наповнять реєстр.
            </p>
          ) : (
            <Link
              href={`/defenders/${selected.pid}`}
              className="mt-5 inline-flex items-center gap-2 rounded-[3px] bg-cream px-5 py-2.5 text-sm font-medium text-void transition-colors hover:bg-white"
            >
              Увійти до історії →
            </Link>
          )}
        </aside>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-void to-transparent pb-5">
        <span className="animate-bounce text-ink-lo">↓</span>
      </div>
    </div>
  );
}
