/**
 * Донаповнює вже імпортованих захисників даними для фільтрів реєстру:
 *  - regionId → район (RAIONS з lib/odesa-geo.ts), визначений за
 *    геокодованим місцем народження (point-in-polygon);
 *  - unitId → військова частина, розпізнана в тексті біографії
 *    ("128-ї окремої гірсько-штурмової бригади" тощо), зведена до
 *    номера частини (той самий номер у різних відмінках — одна частина).
 *
 * Використання:
 *   npx tsx prisma/link-facets.ts --dry-run
 *   npx tsx prisma/link-facets.ts
 */
import { PrismaClient } from "@prisma/client";
import { RAIONS, lonLatToField } from "../../web/lib/odesa-geo";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

function pointInRing(point: readonly [number, number], ring: readonly (readonly [number, number])[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function findRaion(lon: number, lat: number): string | null {
  const p = lonLatToField(lon, lat);
  for (const r of RAIONS) {
    if (pointInRing(p, r.ring)) return r.name;
  }
  return null;
}

const CYR = "а-яіїєґ'’";
const UNIT_RE = new RegExp(
  `(\\d{1,3})[-‑][${CYR}]{0,4}\\s+(окрем[${CYR}]+(?:\\s+[${CYR}\\-]+){0,5}?\\s+(?:бригад[${CYR}]*|батальйон[${CYR}]*|заг[іо]н[${CYR}]*|полк[${CYR}]*|центр[${CYR}]*|дивізіон[${CYR}]*))`,
  "iu",
);

function extractUnitNumber(bio: string): { num: string; raw: string } | null {
  const m = UNIT_RE.exec(bio);
  if (!m) return null;
  return { num: m[1]!, raw: m[0]!.trim() };
}

async function main() {
  const oblast = await prisma.region.findFirst({ where: { level: 1 } });
  if (!oblast) throw new Error("Не знайдено регіон рівня 1 (область) — запустіть основний seed спочатку");

  const raionIdByName = new Map<string, string>();
  for (const r of RAIONS) {
    if (DRY_RUN) {
      raionIdByName.set(r.name, `dry-${r.name}`);
      continue;
    }
    let region = await prisma.region.findFirst({ where: { name: r.name, parentId: oblast.id } });
    if (!region) region = await prisma.region.create({ data: { name: r.name, level: 2, parentId: oblast.id } });
    raionIdByName.set(r.name, region.id);
  }

  const defenders = await prisma.defender.findMany({
    select: { id: true, pid: true, fullName: true, bio: true, birthPlaceId: true, regionId: true, unitId: true },
  });

  let regionLinked = 0;
  let unitLinked = 0;
  const unitIdByNumber = new Map<string, string>();
  const existingUnits = await prisma.unit.findMany();
  for (const u of existingUnits) {
    const m = /^(\d{1,3})/.exec(u.name);
    if (m) unitIdByNumber.set(m[1]!, u.id);
  }

  for (const d of defenders) {
    // ── район за місцем народження ──
    if (!d.regionId && d.birthPlaceId) {
      const rows = await prisma.$queryRaw<{ lon: number; lat: number }[]>`
        SELECT ST_X(geom_point::geometry) AS lon, ST_Y(geom_point::geometry) AS lat
        FROM "place" WHERE id = ${d.birthPlaceId}::uuid AND geom_point IS NOT NULL
      `;
      const coords = rows[0];
      if (coords) {
        const raionName = findRaion(Number(coords.lon), Number(coords.lat));
        if (raionName) {
          const regionId = raionIdByName.get(raionName);
          if (regionId) {
            regionLinked++;
            if (!DRY_RUN) await prisma.defender.update({ where: { id: d.id }, data: { regionId } });
          }
        }
      }
    }

    // ── частина за текстом біографії ──
    if (!d.unitId && d.bio) {
      const found = extractUnitNumber(d.bio);
      if (found) {
        let unitId = unitIdByNumber.get(found.num);
        if (!unitId) {
          unitLinked++;
          if (!DRY_RUN) {
            const name = found.raw.charAt(0).toUpperCase() + found.raw.slice(1);
            const unit = await prisma.unit.create({ data: { name } });
            unitId = unit.id;
          } else {
            unitId = `dry-${found.num}`;
          }
          unitIdByNumber.set(found.num, unitId);
        } else {
          unitLinked++;
        }
        if (!DRY_RUN) await prisma.defender.update({ where: { id: d.id }, data: { unitId } });
      }
    }
  }

  console.log(`Захисників усього: ${defenders.length}`);
  console.log(`Прив'язано район: ${regionLinked}`);
  console.log(`Прив'язано частину: ${unitLinked}, унікальних частин: ${unitIdByNumber.size}`);
  if (DRY_RUN) console.log("(dry-run — нічого не збережено)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
