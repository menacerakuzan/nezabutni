"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { OUTLINE, RAIONS, CITIES, ZMIINYI_ISLAND, FIELD_CX, FIELD_CY, lonLatToField, pointOnLand, type Ring } from "../../lib/odesa-geo";

/**
 * Поле вогнів над Одеською областю. Справжня географія: контур області
 * (geoBoundaries), райони й громади — чинний поділ після реформи 2020
 * (OpenStreetMap, українські назви). Вогник за кожним ім’ям — і лише
 * за реальним ім’ям з реєстру: жодних демонстраційних вогнів. Поки
 * реєстр малий, поле малолюдне — це чесний стан проєкту, а не бага.
 *
 * Позиція вогника:
 *  1. реальні координати з API (місце поховання/загибелі/служби), якщо
 *     захисника вже привʼязано до точки на карті;
 *  2. інакше — місто/район із назви регіону захисника, з детермінованим
 *     (за pid) розкидом, щоб кілька імен з одного міста не стояли пліч-о-пліч;
 *  3. інакше — обласний центр із тим самим розкидом.
 *
 * Рішення щодо продуктивності:
 *  · сяйво вогнів — один пре-рендерений спрайт (drawImage), не градієнти;
 *  · берегова лінія — квадратичні криві через середини ребер (м’яко);
 *    адмінмежі — прямі відрізки, бо кордони реально ламані;
 *  · громади вантажаться з /geo/hromadas.json лише при наближенні
 *    й відсікаються за bbox;
 *  · усі підписи — топоніми й імена — проходять одну чергу з пріоритетом,
 *    тому не накладаються;
 *  · цикл зупиняється, коли поле поза в’юпортом.
 *
 * Прокрутка: звичайне колесо гортає сторінку (щоб хіро не «крав» скрол),
 * наближення — ⌘/Ctrl + колесо, кнопки або подвійний клік.
 */

export interface RealLight {
  pid: string;
  name: string;
  years: string;
  region: string | null;
  lon: number | null;
  lat: number | null;
}

interface Light {
  id: string;
  pid: string;
  name: string;
  years: string;
  cluster: string;
  x: number;
  y: number;
  phase: number;
  size: number;
}

/** Українське число + правильна форма слова (1 вогник, 2 вогники, 5 вогників). */
function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Стабільний хеш рядка 0..1 — для детермінованого (не випадкового щоразу) розкиду. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

interface Cam {
  x: number;
  y: number;
  z: number;
}

interface Bounded {
  ring: Ring;
  name?: string;
  cx: number;
  cy: number;
  r: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Формат /geo/hromadas.json */
interface HromadaRaw {
  name: string;
  ring: [number, number][];
  cx: number;
  cy: number;
  r: number;
}

const MIN_Z = 0.8;
const MAX_Z = 16;
const NAME_Z = 5.2;
const RAION_Z = 1.5; // від цього масштабу проявляються райони
const HROMADA_Z = 3.0; // …і громади

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function bounds(ring: Ring, name?: string, cx?: number, cy?: number, r?: number): Bounded {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return {
    ring,
    name,
    cx: cx ?? (x0 + x1) / 2,
    cy: cy ?? (y0 + y1) / 2,
    r: r ?? Math.max(x1 - x0, y1 - y0) / 2,
    x0,
    y0,
    x1,
    y1,
  };
}

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

export function FieldOfLights({ real, focusPid }: { real: RealLight[]; focusPid?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<Cam>({ x: FIELD_CX, y: FIELD_CY, z: 0.9 });
  const targetRef = useRef<Cam>({ x: FIELD_CX, y: FIELD_CY, z: 0.9 });
  const dragRef = useRef<{ px: number; py: number; moved: boolean } | null>(null);
  const hoverRef = useRef<Light | null>(null);
  const rafRef = useRef(0);
  const reduceRef = useRef(false);
  const hromadasRef = useRef<Bounded[] | null>(null);
  const hromadaLoadRef = useRef(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<Light | null>(null);
  const [query, setQuery] = useState("");
  const [immersed, setImmersed] = useState(false);
  const [scrollHint, setScrollHint] = useState(false);
  const immersedRef = useRef(false);
  const queryRef = useRef("");
  queryRef.current = query.trim().toLowerCase();

  const raions = useMemo(
    () => RAIONS.map((r) => bounds(r.ring, r.name, r.cx, r.cy, r.r)),
    []
  );

  const lights = useMemo<Light[]>(() => {
    const odesa = CITIES[0]!;
    return real.map((r) => {
      const h1 = hash01(r.pid);
      const h2 = hash01(r.pid + ":y");
      const angle = h1 * Math.PI * 2;

      let baseX: number;
      let baseY: number;
      let spread: number;

      if (r.lon !== null && r.lat !== null) {
        // Реальна точка з API — розкид лише мікроскопічний, щоб не злипався
        // рівно один-в-один із сусіднім вогником на тому самому місці.
        [baseX, baseY] = lonLatToField(r.lon, r.lat);
        spread = 0.004;
      } else {
        // Немає точної точки — шукаємо місто/район за назвою регіону.
        const norm = (s: string) => s.toLowerCase().replace(/[’'‘`]/g, "");
        const regionNorm = r.region ? norm(r.region) : "";
        const city =
          (regionNorm && CITIES.find((c) => regionNorm.includes(norm(c.name)))) || odesa;
        baseX = city.x;
        baseY = city.y;
        spread = city === odesa ? 0.05 : 0.03;
      }

      // Випадковий кут для прибережного міста (Ізмаїл, Кілія, Южне,
      // Болград…) чи прибережної реальної точки часто веде в море —
      // перебираємо кут, поки розкид не влучить у контур області; якщо
      // геть не вдалось (тісний закуток берега), лишаємо точку без розкиду.
      const r0 = spread * (0.3 + h2 * 0.7);
      let x = baseX + Math.cos(angle) * r0;
      let y = baseY + Math.sin(angle) * r0 * 0.85;
      if (!pointOnLand([x, y])) {
        let placed = false;
        for (let k = 1; k <= 11; k++) {
          const a = angle + (k * Math.PI * 2) / 12;
          const cx = baseX + Math.cos(a) * r0;
          const cy = baseY + Math.sin(a) * r0 * 0.85;
          if (pointOnLand([cx, cy])) {
            x = cx;
            y = cy;
            placed = true;
            break;
          }
        }
        if (!placed) {
          x = baseX;
          y = baseY;
        }
      }

      return {
        id: `real-${r.pid}`,
        pid: r.pid,
        name: r.name,
        years: r.years,
        cluster: r.region ?? odesa.name,
        x,
        y,
        phase: h1 * Math.PI * 2,
        size: 1.7,
      };
    });
  }, [real]);

  const total = lights.length;

  // Перехід сюди зі сторінки конкретного захисника ("Місця його шляху") —
  // одразу летимо й обираємо саме його вогник, а не показуємо загальне поле.
  useEffect(() => {
    if (!focusPid) return;
    const light = lights.find((l) => l.pid === focusPid);
    if (!light) return;
    setSelected(light);
    targetRef.current = { x: light.x + 0.02, y: light.y, z: 7.5 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPid, lights]);

  const toScreen = useCallback((l: { x: number; y: number }, cam: Cam, w: number, h: number) => {
    const s = Math.min(w, h) * cam.z;
    return { x: w / 2 + (l.x - cam.x) * s, y: h / 2 + (l.y - cam.y) * s };
  }, []);
  const toWorld = useCallback((sx: number, sy: number, cam: Cam, w: number, h: number) => {
    const s = Math.min(w, h) * cam.z;
    return { x: cam.x + (sx - w / 2) / s, y: cam.y + (sy - h / 2) / s };
  }, []);

  const flashHint = useCallback(() => {
    setScrollHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setScrollHint(false), 1700);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const spriteWarm = makeGlowSprite(true);
    const spriteBase = makeGlowSprite(false);

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
        const shift = w > h ? 0.1 * (w / h - 1) : 0;
        camRef.current.x = FIELD_CX - shift;
        targetRef.current.x = FIELD_CX - shift;
        placedCamera = true;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    /**
     * Берегова лінія — м’яка крива: вершини як контрольні точки, лінія йде
     * через середини ребер. Прибирає рубленість спрощеного контуру.
     */
    const strokeRing = (ring: Ring, cam: Cam) => {
      const n = ring.length;
      if (n < 3) return;
      const s = Math.min(w, h) * cam.z;
      const px = (i: number) => w / 2 + (ring[i]![0] - cam.x) * s;
      const py = (i: number) => h / 2 + (ring[i]![1] - cam.y) * s;
      ctx.beginPath();
      ctx.moveTo((px(0) + px(1)) / 2, (py(0) + py(1)) / 2);
      for (let i = 1; i < n; i++) {
        const j = (i + 1) % n;
        ctx.quadraticCurveTo(px(i), py(i), (px(i) + px(j)) / 2, (py(i) + py(j)) / 2);
      }
      ctx.closePath();
    };

    /**
     * Адміністративні межі — прямі відрізки. Кордони районів і громад
     * реально ламані; згладжування перетворює їх на «хмари», тож тут воно
     * шкідливе.
     */
    const strokePoly = (ring: Ring, cam: Cam) => {
      const n = ring.length;
      if (n < 3) return;
      const s = Math.min(w, h) * cam.z;
      ctx.beginPath();
      ctx.moveTo(w / 2 + (ring[0]![0] - cam.x) * s, h / 2 + (ring[0]![1] - cam.y) * s);
      for (let i = 1; i < n; i++) {
        ctx.lineTo(w / 2 + (ring[i]![0] - cam.x) * s, h / 2 + (ring[i]![1] - cam.y) * s);
      }
      ctx.closePath();
    };

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

      // ліниве довантаження громад
      if (cam.z > HROMADA_Z - 0.6 && !hromadasRef.current && !hromadaLoadRef.current) {
        hromadaLoadRef.current = true;
        fetch("/geo/hromadas.json")
          .then((r) => (r.ok ? r.json() : null))
          .then((d: HromadaRaw[] | null) => {
            if (d) hromadasRef.current = d.map((x) => bounds(x.ring, x.name, x.cx, x.cy, x.r));
          })
          .catch(() => {});
      }

      // ── ніч і море ──
      const seaGrad = ctx.createLinearGradient(0, 0, 0, h);
      seaGrad.addColorStop(0, "#07080C");
      seaGrad.addColorStop(0.55, "#080B12");
      seaGrad.addColorStop(1, "#0A1220");
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, w, h);

      // ── суходіл ──
      strokeRing(OUTLINE, cam);
      ctx.strokeStyle = "rgba(150,180,220,0.05)";
      ctx.lineWidth = 8;
      ctx.stroke();

      strokeRing(OUTLINE, cam);
      const landTop = toScreen({ x: FIELD_CX, y: 0 }, cam, w, h).y;
      const landBot = toScreen({ x: FIELD_CX, y: 1 }, cam, w, h).y;
      const landGrad = ctx.createLinearGradient(0, landTop, 0, landBot);
      landGrad.addColorStop(0, "rgba(251,243,233,0.045)");
      landGrad.addColorStop(0.6, "rgba(251,243,233,0.028)");
      landGrad.addColorStop(1, "rgba(223,155,59,0.03)");
      ctx.fillStyle = landGrad;
      ctx.fill();

      // текстура + внутрішні межі — під кліпом суші
      ctx.save();
      ctx.clip();

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = landPattern;
      const offX = (cam.x * 40) % 22;
      const offY = (cam.y * 40) % 22;
      ctx.translate(-offX, -offY);
      ctx.fillRect(-22, -22, w + 44, h + 44);
      ctx.translate(offX, offY);
      ctx.globalAlpha = 1;

      // громади — найтонший шар
      const hroA = clamp01((cam.z - HROMADA_Z) / 1.8) * 0.3;
      if (hroA > 0.01 && hromadasRef.current) {
        const vx0 = cam.x - w / 2 / (Math.min(w, h) * cam.z);
        const vx1 = cam.x + w / 2 / (Math.min(w, h) * cam.z);
        const vy0 = cam.y - h / 2 / (Math.min(w, h) * cam.z);
        const vy1 = cam.y + h / 2 / (Math.min(w, h) * cam.z);
        ctx.strokeStyle = `rgba(251,243,233,${hroA})`;
        ctx.lineWidth = 0.6;
        for (const b of hromadasRef.current) {
          if (b.x1 < vx0 || b.x0 > vx1 || b.y1 < vy0 || b.y0 > vy1) continue;
          strokePoly(b.ring, cam);
          ctx.stroke();
        }
      }

      // райони — виразніші за громади
      const raiA = clamp01((cam.z - RAION_Z) / 1.2) * 0.42;
      if (raiA > 0.01) {
        ctx.strokeStyle = `rgba(251,243,233,${raiA})`;
        ctx.lineWidth = 0.9;
        for (const b of raions) {
          strokePoly(b.ring, cam);
          ctx.stroke();
        }
      }
      ctx.restore();

      // контур області — головна лінія
      strokeRing(OUTLINE, cam);
      ctx.strokeStyle = `rgba(251,243,233,${cam.z > 4 ? 0.3 : 0.42})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const time = now / 1000;
      const q = queryRef.current;
      const hover = hoverRef.current;
      const showNames = cam.z >= NAME_Z;

      if (cam.z < 1.6) {
        const t = toScreen({ x: FIELD_CX - 0.02, y: 0.3 }, cam, w, h);
        ctx.font = "600 30px var(--font-odesa), sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(251,243,233,${0.1 * (1.6 - cam.z) * 2.2})`;
        ctx.fillText("ОДЕСЬКА ОБЛАСТЬ", t.x, t.y);
        ctx.textAlign = "left";
      }

      // ── єдина черга підписів ──
      // Топоніми й імена розкладаються одним алгоритмом за пріоритетом,
      // тож нічого не наповзає одне на одне. Топоніми — приглушений
      // розріджений регістр, імена — світлі: два різні шари читання.
      type Label = {
        text: string;
        x: number;
        y: number;
        font: string;
        color: string;
        prio: number;
        center?: boolean;
        track?: number;
      };
      const labels: Label[] = [];

      // міста
      ctx.textAlign = "left";
      for (const c of CITIES) {
        const visible = c.tier === 1 || (c.tier === 2 && cam.z > 1.35) || cam.z > 2.4;
        if (!visible) continue;
        const p = toScreen(c, cam, w, h);
        if (p.x < -80 || p.x > w + 80 || p.y < -20 || p.y > h + 20) continue;
        const a = c.tier === 1 ? 0.82 : 0.55;
        ctx.fillStyle = `rgba(251,243,233,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, c.tier === 1 ? 2.6 : 1.7, 0, Math.PI * 2);
        ctx.fill();
        labels.push({
          text: c.name,
          x: p.x + 8,
          y: p.y + 4,
          font: `${c.tier === 1 ? 600 : 500} ${c.tier === 1 ? 13 : 11.5}px var(--font-odesa), sans-serif`,
          color: `rgba(251,243,233,${a})`,
          prio: c.tier === 1 ? 1 : 5,
        });
      }

      // острів Зміїний — завжди видимий, окремим значком (не місто й не вогник)
      {
        const p = toScreen(ZMIINYI_ISLAND, cam, w, h);
        if (p.x > -80 && p.x < w + 80 && p.y > -20 && p.y < h + 20) {
          ctx.save();
          ctx.strokeStyle = "rgba(251,243,233,0.85)";
          ctx.fillStyle = "rgba(251,243,233,0.55)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 4.5);
          ctx.lineTo(p.x + 4.5, p.y + 3.5);
          ctx.lineTo(p.x - 4.5, p.y + 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          labels.push({
            text: ZMIINYI_ISLAND.name,
            x: p.x + 9,
            y: p.y + 4,
            font: "600 12px var(--font-odesa), sans-serif",
            color: "rgba(251,243,233,0.85)",
            prio: 1,
          });
        }
      }

      // назви районів — доки не з’явилися громади
      const raionTextA = clamp01((cam.z - 1.15) / 0.5) * clamp01((4.6 - cam.z) / 1.1) * 0.55;
      if (raionTextA > 0.02) {
        const s = Math.min(w, h) * cam.z;
        for (const r of RAIONS) {
          if (r.r * s < 90) continue; // замалий на екрані — підпис нечитабельний
          const p = toScreen({ x: r.cx, y: r.cy }, cam, w, h);
          if (p.x < -100 || p.x > w + 100 || p.y < -30 || p.y > h + 30) continue;
          labels.push({
            text: r.name.toUpperCase(),
            x: p.x,
            y: p.y,
            font: `600 12px var(--font-odesa), sans-serif`,
            color: `rgba(251,243,233,${raionTextA})`,
            prio: 2,
            center: true,
            track: 1.6,
          });
        }
      }

      // назви громад — на глибокому масштабі
      const hromTextA = clamp01((cam.z - HROMADA_Z - 0.3) / 1.2) * 0.42;
      if (hromTextA > 0.02 && hromadasRef.current) {
        const s = Math.min(w, h) * cam.z;
        for (const b of hromadasRef.current) {
          if (!b.name || b.r * s < 60) continue;
          const p = toScreen({ x: b.cx, y: b.cy }, cam, w, h);
          if (p.x < -100 || p.x > w + 100 || p.y < -30 || p.y > h + 30) continue;
          labels.push({
            text: b.name.toUpperCase(),
            x: p.x,
            y: p.y,
            font: `600 9.5px var(--font-odesa), sans-serif`,
            color: `rgba(251,243,233,${hromTextA})`,
            prio: 4,
            center: true,
            track: 1.2,
          });
        }
      }

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

      // ── вогні ──
      for (const l of lights) {
        const p = toScreen(l, cam, w, h);
        if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) continue;

        const matches = q.length >= 2 && l.name.toLowerCase().includes(q);
        const dimmed = q.length >= 2 && !matches;
        const isHover = hover?.id === l.id;
        const isSel = selected?.id === l.id;

        // Дихання вічного вогню: три несинхронні гармоніки плюс власний темп
        // у кожного вогника — тому поле мерехтить нерівно, як живе полум’я,
        // а не пульсує в такт. Амплітуда навмисно велика — вогник справді
        // гасне до нуля й розгорається знову, а не просто тьмяніє.
        const ph = l.phase;
        const spd = 0.72 + (ph % 1) * 0.62; // власна швидкість вогника
        const flickerRaw =
          0.5 +
          0.42 * Math.sin(time * 1.4 * spd + ph) +
          0.09 * Math.sin(time * 3.1 * spd + ph * 2.3) +
          0.06 * Math.sin(time * 5.4 * spd + ph * 0.9);
        const flicker = reduceRef.current ? 1 : Math.max(0, flickerRaw);

        const breath = reduceRef.current
          ? 1
          : 1 + 0.2 * Math.sin(time * 1.6 * spd + ph * 1.7);
        // Зростання розміру обмежене: зблизька вогники лишаються свічками,
        // а не перетворюються на прожектори.
        const zScale = 1.1 + Math.min(cam.z, 5.5) * 0.42;
        const base = zScale * l.size * breath * (isHover || isSel ? 1.9 : 1);
        const alpha = dimmed ? 0.08 : 0.95 * flicker;
        const sprite = matches || isHover || isSel ? spriteWarm : spriteBase;
        const R = base * 5;

        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, p.x - R, p.y - R, R * 2, R * 2);
        ctx.globalAlpha = Math.min(1, alpha * 1.05);
        ctx.fillStyle = "#FFF6E6";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, base * 0.8), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if ((showNames && !dimmed) || matches || isHover || isSel) {
          const nameAlpha =
            isHover || isSel || matches ? 0.95 : Math.min(0.75, (cam.z - NAME_Z) * 0.28 + 0.2);
          if (nameAlpha > 0.05) {
            labels.push({
              text: l.name,
              x: p.x + base * 4 + 6,
              y: p.y + 4,
              font: `${isHover || isSel ? 600 : 500} ${isHover || isSel ? 13 : 12}px var(--font-odesa), sans-serif`,
              color: `rgba(251,243,233,${nameAlpha})`,
              // наведене/обране → збіги пошуку → решта
              prio: isHover || isSel ? 0 : matches ? 3 : 6,
            });
          }
        }
      }

      // Розкладка: жадібно за пріоритетом, з перевіркою на перекриття.
      // Що не вмістилося — просто не малюємо, тож карта лишається чистою.
      if (labels.length) {
        labels.sort((a, b) => a.prio - b.prio || a.y - b.y);
        const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
        for (const lb of labels) {
          ctx.font = lb.font;
          const spaced = lb.track
            ? lb.text.split("").join(String.fromCharCode(8202))
            : lb.text;
          const tw = ctx.measureText(spaced).width;
          const x = lb.center ? lb.x - tw / 2 : lb.x;
          const box = { x0: x - 3, y0: lb.y - 11, x1: x + tw + 3, y1: lb.y + 4 };
          let hit = false;
          for (const b of placed) {
            if (box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0) {
              hit = true;
              break;
            }
          }
          if (hit) continue;
          placed.push(box);
          ctx.strokeStyle = "rgba(8,9,13,0.8)";
          ctx.lineWidth = 3;
          ctx.strokeText(spaced, x, lb.y);
          ctx.fillStyle = lb.color;
          ctx.fillText(spaced, x, lb.y);
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

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

    const zoomAt = (sx: number, sy: number, factor: number) => {
      const tgt = targetRef.current;
      const before = toWorld(sx, sy, tgt, w, h);
      tgt.z = Math.min(MAX_Z, Math.max(MIN_Z, tgt.z * factor));
      const after = toWorld(sx, sy, tgt, w, h);
      tgt.x += before.x - after.x;
      tgt.y += before.y - after.y;
    };

    // Прокрутка сторінки лишається за сторінкою; мапа наближається лише
    // з модифікатором (як у вбудованих картах) або кнопками.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        if (Math.abs(e.deltaY) > 2) flashHint();
        return; // без preventDefault → гортається сторінка
      }
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0016));
    };

    const onDblClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, 1.8);
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
      // Картка вогника — фіксована панель, її не треба центрувати камерою;
      // примусовий переліт+зум при кліку лише збивав з пантелику ("кудись
      // несе"). Клік просто відкриває картку, вид лишається на місці.
      setSelected(hit);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDblClick);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDblClick);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [lights, selected, raions, toScreen, toWorld, flashHint]);

  const zoomBy = (f: number) => {
    const t = targetRef.current;
    t.z = Math.min(MAX_Z, Math.max(MIN_Z, t.z * f));
  };
  const reset = () => {
    targetRef.current = { x: camRef.current.x, y: FIELD_CY, z: 0.9 };
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
          {total > 0 ? (
            <>
              {total} {pluralize(total, "вогник", "вогники", "вогників")} пам’яті на мапі
              області. Наблизьтеся — вогні стануть іменами. Торкніться вогника — увійдіть до
              історії.
            </>
          ) : (
            <>
              Поле ще порожнє — тут з’являться імена, щойно родини подадуть перші історії, а
              модератори їх підтвердять.
            </>
          )}
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

      {/* Підказка про наближення — з’являється при спробі гортати над мапою */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
          scrollHint ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="rounded-[3px] border border-hair-strong bg-[#0B0F16]/95 px-5 py-3 text-sm text-cream">
          Утримуйте <kbd className="mx-1 rounded border border-hair px-1.5 py-0.5 text-xs">⌘</kbd>
          або <kbd className="mx-1 rounded border border-hair px-1.5 py-0.5 text-xs">Ctrl</kbd>,
          щоб наблизити мапу
        </p>
      </div>

      {/* Підказка керування */}
      <div
        className={`pointer-events-none absolute bottom-24 left-6 transition-opacity duration-700 md:left-10 ${
          immersed ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-xs text-ink-lo">
          Тягніть, щоб рухатися · ⌘/Ctrl + колесо або подвійний клік — наближення
        </p>
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
          <span className="caption">Сторінка пам’яті</span>
          <h2 className="mt-3 font-display text-2xl font-semibold uppercase leading-tight text-cream">
            {selected.name}
          </h2>
          <p className="mt-2 text-sm text-ink">
            {selected.years} · {selected.cluster}
          </p>
          <Link
            href={`/defenders/${selected.pid}`}
            className="mt-5 inline-flex items-center gap-2 rounded-[3px] bg-cream px-5 py-2.5 text-sm font-medium text-void transition-colors hover:bg-white"
          >
            Увійти до історії →
          </Link>
        </aside>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-void to-transparent pb-5">
        <span className="animate-bounce text-ink-lo">↓</span>
      </div>
    </div>
  );
}
