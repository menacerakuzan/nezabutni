/**
 * Детерміновані демонстраційні імена для «Поля вогнів».
 * Вогні розсіяні навколо реальних міст Одеської області (lib/odesa-geo.ts).
 * У панелі кожне позначено як демонстраційне; у продакшні поле живиться
 * лише реальним реєстром.
 */

import { CITIES, type GeoCity } from "./odesa-geo";

const FIRST = [
  "Андрій", "Олег", "Тарас", "Сергій", "Максим", "Богдан", "Василь", "Дмитро",
  "Іван", "Юрій", "Олександр", "Володимир", "Роман", "Павло", "Микола", "Артем",
  "Денис", "Євген", "Назар", "Орест", "Святослав", "Ярослав", "Віталій", "Ігор",
  "Оксана", "Ірина", "Юлія", "Олена", "Марія", "Тетяна",
];
const LAST = [
  "Шевченко", "Ковальчук", "Бондаренко", "Мельник", "Кравченко", "Олійник",
  "Ткаченко", "Савченко", "Руденко", "Мороз", "Лисенко", "Петренко", "Клименко",
  "Марченко", "Павленко", "Сидоренко", "Гончар", "Козак", "Черненко", "Дяченко",
  "Романюк", "Гаврилюк", "Поліщук", "Довженко", "Вербицький", "Сорока",
];
const PATRO = [
  "Андрійович", "Олегович", "Тарасович", "Сергійович", "Максимович",
  "Богданович", "Васильович", "Дмитрович", "Іванович", "Юрійович",
  "Олександрович", "Володимирович", "Романович", "Павлович", "Миколайович",
  "Ігорівна", "Василівна", "Андріївна", "Сергіївна", "Олександрівна",
];

export interface DemoLight {
  id: string;
  name: string;
  years: string;
  cluster: string;
  x: number;
  y: number;
  demo: true;
}

// Простий детермінований PRNG (mulberry32)
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TIER_WEIGHT: Record<GeoCity["tier"], number> = { 1: 10, 2: 4, 3: 2 };
const TIER_SPREAD: Record<GeoCity["tier"], number> = { 1: 0.055, 2: 0.038, 3: 0.03 };

export function generateDemoLights(count = 420, seed = 20240224): DemoLight[] {
  const rand = rng(seed);
  const lights: DemoLight[] = [];
  const totalWeight = CITIES.reduce((s, c) => s + TIER_WEIGHT[c.tier], 0);

  for (let i = 0; i < count; i++) {
    let pick = rand() * totalWeight;
    let city: GeoCity = CITIES[0]!;
    for (const c of CITIES) {
      pick -= TIER_WEIGHT[c.tier];
      if (pick <= 0) {
        city = c;
        break;
      }
    }
    const a = rand() * Math.PI * 2;
    const d = (rand() + rand() + rand()) / 3;
    const spread = TIER_SPREAD[city.tier];
    const x = city.x + Math.cos(a) * d * spread;
    const y = city.y + Math.sin(a) * d * spread * 0.8;

    const fi = Math.floor(rand() * FIRST.length);
    const isFemale = fi >= FIRST.length - 6;
    const first = FIRST[fi]!;
    const last = LAST[Math.floor(rand() * LAST.length)]!;
    const patro = isFemale
      ? PATRO[15 + Math.floor(rand() * 5)]!
      : PATRO[Math.floor(rand() * 15)]!;

    const birth = 1968 + Math.floor(rand() * 36);
    const death = 2022 + Math.floor(rand() * 3.2);

    lights.push({
      id: `demo-${i}`,
      name: `${last} ${first} ${patro}`,
      years: `${birth} — ${death}`,
      cluster: city.name,
      x,
      y,
      demo: true,
    });
  }
  return lights;
}
