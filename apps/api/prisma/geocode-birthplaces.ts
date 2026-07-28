/**
 * Розбирає bio вже імпортованих захисників, шукає речення про народження,
 * витягує назву населеного пункту й геокодує через Nominatim (OSM) —
 * лише для точок в межах Одеської області (все інше відкидаємо чесно,
 * а не вгадуємо). Результат: place (type: settlement, службовий — не
 * показується на карті пам'яті) + defender.birth_place_id.
 *
 * Nominatim: 1 запит/сек, свій User-Agent — політика використання OSM.
 * Місця дедуплікуються за нормалізованою назвою, тож повторні запуски
 * лише донаповнюють нових захисників без народження, не б'ють по API.
 *
 * Використання:
 *   npx tsx prisma/geocode-birthplaces.ts --dry-run
 *   npx tsx prisma/geocode-birthplaces.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

// Одеська область — bounding box для перевірки й підказки геокодеру.
const BBOX = { minLon: 28.0, minLat: 45.2, maxLon: 31.0, maxLat: 48.6 };

const BIRTH_TRIGGER = /народи[а-яіїєґ]*|родженец|родженк|родом з/iu;
const PLACE_A =
  /(?:родом\s+з|уродженец[а-яіїєґ]*|уродженк[а-яіїєґ]*)\s+(?:села|міста|селища|селищі|смт\.?)?\s*([А-ЯІЇЄҐ][^,.]{1,60})/u;
const PLACE_B = /(?:у|в)\s+(?:місті|селі|селищі|смт\.?)?\s*([А-ЯІЇЄҐ][^,.]{1,60})/u;

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/u);
}

// Текст часто вже містить "Одеської області"/"на Одещині" — якщо додати
// власний суфікс поверх цього, Nominatim перестає щось знаходити взагалі
// (структурований запит з областю, згаданою двічі, повертає порожньо).
const REGION_MENTION = /,?\s*(?:на\s+Одещині|Одещини|Одеської\s+област[іюь]|Одеської\s+обл\.?)\s*$/iu;
const RAION_MENTION = /,?\s*(?:у\s+)?[А-ЯІЇЄҐа-яіїєґ'’-]+(?:ського|ому)\s+районі?у?\s*$/iu;

function extractBirthplace(bio: string): string | null {
  for (const sentence of splitSentences(bio)) {
    if (!BIRTH_TRIGGER.test(sentence)) continue;
    const m = PLACE_A.exec(sentence) ?? PLACE_B.exec(sentence);
    if (!m) continue;
    let name = m[1]!.trim().replace(REGION_MENTION, "").trim();
    name = name.replace(RAION_MENTION, "").trim();
    if (name) return name;
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(query: string): Promise<{ lon: number; lat: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: `${query}, Одеська область, Україна`,
    format: "json",
    limit: "1",
    countrycodes: "ua",
  })}`;
  const res = await fetch(url, { headers: { "User-Agent": "NezabutniMemorial/1.0 (one-off geocoding import)" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data.length) return null;
  const lat = Number(data[0]!.lat);
  const lon = Number(data[0]!.lon);
  if (lat < BBOX.minLat || lat > BBOX.maxLat || lon < BBOX.minLon || lon > BBOX.maxLon) return null;
  return { lon, lat };
}

async function main() {
  const defenders = await prisma.defender.findMany({
    where: { birthPlaceId: null, bio: { not: null } },
    select: { id: true, pid: true, fullName: true, bio: true },
  });
  console.log(`Захисників без місця народження: ${defenders.length}`);

  const withPlace = defenders
    .map((d) => ({ ...d, placeName: extractBirthplace(d.bio!) }))
    .filter((d): d is typeof d & { placeName: string } => d.placeName !== null);
  console.log(`Знайдено фразу про народження: ${withPlace.length}`);

  const uniqueNames = [...new Set(withPlace.map((d) => d.placeName))];
  console.log(`Унікальних назв місць: ${uniqueNames.length}`);

  if (DRY_RUN) {
    console.log("\nРежим: DRY RUN — лише список, без геокодування й запису");
    for (const d of withPlace) console.log(`  ${d.fullName} → "${d.placeName}"`);
    return;
  }

  const geocoded = new Map<string, { lon: number; lat: number } | null>();
  let i = 0;
  for (const name of uniqueNames) {
    i++;
    const result = await geocode(name);
    geocoded.set(name, result);
    console.log(`[${i}/${uniqueNames.length}] ${name} → ${result ? `${result.lat}, ${result.lon}` : "не знайдено / поза областю"}`);
    await sleep(1100); // Nominatim: не частіше 1 запиту/сек
  }

  const placeIdByName = new Map<string, string>();
  let linked = 0;
  for (const d of withPlace) {
    const coords = geocoded.get(d.placeName);
    if (!coords) continue;

    let placeId = placeIdByName.get(d.placeName);
    if (!placeId) {
      const existing = await prisma.place.findFirst({ where: { name: d.placeName, type: "settlement" } });
      if (existing) {
        placeId = existing.id;
      } else {
        const place = await prisma.place.create({
          data: { type: "settlement", name: d.placeName, status: "published" },
        });
        await prisma.$executeRawUnsafe(
          `UPDATE "place" SET "geom_point" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3::uuid`,
          coords.lon,
          coords.lat,
          place.id,
        );
        placeId = place.id;
      }
      placeIdByName.set(d.placeName, placeId);
    }

    await prisma.defender.update({ where: { id: d.id }, data: { birthPlaceId: placeId } });
    linked++;
  }

  console.log(`\nПрив'язано місце народження: ${linked} / ${withPlace.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
