/**
 * Імпорт "Алей слави" 91 громади Одеської області — точки на карті пам'яті
 * (тип Place.type = "alley_of_glory"), знайдені веб-пошуком (новини, сайти
 * рад громад, офіційні джерела). Дані зібрані окремо в prisma/data/alleys.json
 * (масив: hromada, raion, found, location_name, description, source_url,
 * photo_url, lat, lon, coord_source) — цей скрипт лише вставляє те, що вже
 * підтверджено джерелом; записи з found=false пропускаються (нічого не
 * вигадуємо для громад, де реальної Алеї Слави не знайдено).
 *
 * Напряму через Prisma — без HTTP, без rate limit на /media/upload (той самий
 * підхід, що й import-archive.ts).
 *
 * Використання:
 *   npx tsx prisma/import-alleys.ts --dry-run
 *   npx tsx prisma/import-alleys.ts
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";
async function storagePut(key: string, buffer: Buffer): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
}

const IMAGE_SIGNATURES: { mime: string; ext: string; match: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", ext: ".jpg", match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: ".png", match: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: "image/webp",
    ext: ".webp",
    match: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, arr): [string, string | boolean][] => {
    if (!a.startsWith("--")) return [];
    const key = a.slice(2);
    const next = arr[i + 1];
    if (next && !next.startsWith("--")) return [[key, next]];
    return [[key, true]];
  }),
) as Record<string, string | boolean>;

const DATA_FILE = String(args.data ?? path.resolve(__dirname, "data/alleys.json"));
const DRY_RUN = Boolean(args["dry-run"]);

interface AlleyEntry {
  hromada: string;
  raion: string;
  found: boolean;
  location_name: string | null;
  description: string | null;
  source_url: string | null;
  photo_url: string | null;
  lat: number | null;
  lon: number | null;
  coord_source: string | null;
}

async function uploadPhoto(url: string, sourceUrl: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (nezabutni memorial import)" } });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const sig = IMAGE_SIGNATURES.find((s) => s.match(buffer));
    if (!sig) return null;
    const checksum = createHash("sha256").update(buffer).digest("hex");

    const existing = await prisma.mediaAsset.findFirst({ where: { storageChecksum: checksum } });
    if (existing) return existing.id;

    const key = `${checksum}${sig.ext}`;
    if (!DRY_RUN) await storagePut(key, buffer);

    if (DRY_RUN) return "dry-run-media-id";
    const asset = await prisma.mediaAsset.create({
      data: {
        kind: "photo",
        masterUri: key,
        storageChecksum: checksum,
        mimeType: sig.mime,
        fileSizeBytes: BigInt(buffer.length),
        rightsStatement: `Джерело: ${sourceUrl}. Використано в інформаційних/меморіальних цілях без комерційної мети.`,
        provenance: sourceUrl,
        status: "published",
      },
    });
    return asset.id;
  } catch (err) {
    console.warn(`  ! не вдалось завантажити фото ${url}: ${(err as Error).message}`);
    return null;
  }
}

function slugify(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", " ": "-",
  };
  const transliterated = name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
  return (
    transliterated
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 7)
  );
}

async function main() {
  const raw = await readFile(DATA_FILE, "utf-8");
  const entries: AlleyEntry[] = JSON.parse(raw);

  let created = 0;
  let skippedNotFound = 0;
  let skippedNoCoords = 0;
  let withPhoto = 0;

  for (const e of entries) {
    if (!e.found) {
      skippedNotFound++;
      continue;
    }
    if (e.lat === null || e.lon === null) {
      console.warn(`  ! пропущено (немає координат): ${e.hromada}`);
      skippedNoCoords++;
      continue;
    }

    const name = `Алея слави — ${e.hromada} громада${e.location_name ? `, ${e.location_name}` : ""}`;
    const descParts = [e.description, e.source_url ? `Джерело: ${e.source_url}` : null].filter(Boolean);
    const description = descParts.join("\n\n");

    let coverMediaId: string | null = null;
    if (e.photo_url && e.source_url) {
      coverMediaId = await uploadPhoto(e.photo_url, e.source_url);
      if (coverMediaId) withPhoto++;
    }

    console.log(`✓ ${name}${coverMediaId ? " (з фото)" : ""}`);
    created++;

    if (DRY_RUN) continue;

    const slug = slugify(name);
    const place = await prisma.place.create({
      data: {
        type: "alley_of_glory",
        name,
        slug,
        description,
        coverMediaId,
        status: "published",
      },
    });
    await prisma.$executeRawUnsafe(
      `UPDATE "place" SET "geom_point" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3::uuid`,
      e.lon,
      e.lat,
      place.id,
    );
  }

  console.log(`\nСтворено: ${created} (з фото: ${withPhoto})`);
  console.log(`Пропущено (не знайдено): ${skippedNotFound}`);
  console.log(`Пропущено (без координат): ${skippedNoCoords}`);
  if (DRY_RUN) console.log("(dry-run — нічого не збережено)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
