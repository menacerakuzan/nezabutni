/**
 * Імпорт архіву "Меморіал Героїв" (тека на диску: ім'я → фото + .docx текст)
 * напряму через Prisma — без HTTP, без rate limit на /media/upload
 * (там навмисно суворий ліміт 20/10хв проти спаму завантажень ззовні,
 * який для одноразового адмінського імпорту не підходить).
 *
 * Використання:
 *   npx tsx prisma/import-archive.ts --dry-run
 *   npx tsx prisma/import-archive.ts
 *   npx tsx prisma/import-archive.ts --dir "/шлях/до/архіву" --only "Іванов,Петров"
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// Локальний диск, той самий формат ключів, що й src/media/storage/local-storage.provider.ts.
// Інлайн тут навмисно: цей скрипт має лишатися самодостатнім і запускним
// як у dev (є src/), так і всередині продового образу (лише dist/, без src/).
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";
async function storagePut(key: string, buffer: Buffer): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
}

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, arr) => {
    if (!a.startsWith("--")) return [];
    const key = a.slice(2);
    const next = arr[i + 1];
    if (next && !next.startsWith("--")) return [[key, next]];
    return [[key, true]];
  }),
);

const ARCHIVE_DIR = String(args.dir ?? path.resolve(__dirname, "../../../archive/Меморіал Героїв"));
const DRY_RUN = Boolean(args["dry-run"]);
const ONLY = args.only as string | undefined;
const ADMIN_EMAIL = String(args.email ?? "admin@memorial.dev");

const MONTHS_UK: Record<string, string> = {
  січня: "01", лютого: "02", березня: "03", квітня: "04", травня: "05", червня: "06",
  липня: "07", серпня: "08", вересня: "09", жовтня: "10", листопада: "11", грудня: "12",
};
const MONTH_RE = Object.keys(MONTHS_UK).join("|");
const DATE_RE = new RegExp(`(\\d{1,2})\\s+(${MONTH_RE})\\s+(\\d{4})\\s*(?:рок\\w*|-го)`, "u");
const DEATH_WORDS = ["загинув", "поліг", "помер", "загину", "останн", "смертельні поранення", "віддав життя", "не стало"];
const CALLSIGN_RE = /(?:на\s+псевдо|псевдо|позивний)\s*[«"]?\s*([А-ЯІЇЄҐ][’'А-ЯІЇЄҐа-яіїєґ-]*)/u;

const NAME_OVERRIDES: Record<string, string> = {
  "Павло Петренко -Костянтин": "Павло Петренко",
};

const IMAGE_SIGNATURES: { mime: string; ext: string; match: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", ext: ".jpg", match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: ".png", match: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: "image/webp",
    ext: ".webp",
    match: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

function toIsoDate(m: RegExpMatchArray): string {
  const [, day, monthName, year] = m;
  return `${year}-${MONTHS_UK[monthName!]}-${day!.padStart(2, "0")}`;
}

function cleanFolderName(raw: string): string {
  const overridden = NAME_OVERRIDES[raw];
  if (overridden) return overridden;
  return raw
    .replace(/_(?=[а-яіїєґ])/gu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

function extractParagraphs(xml: string): string[] {
  const paras = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/gu) ?? [];
  const out: string[] = [];
  for (const p of paras) {
    const runs = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gu)].map((m) => m[1]);
    let text = runs.join("");
    text = text
      .replace(/&amp;/gu, "&")
      .replace(/&lt;/gu, "<")
      .replace(/&gt;/gu, ">")
      .replace(/&quot;/gu, '"')
      .replace(/&apos;/gu, "'")
      .replace(/\s+/gu, " ")
      .trim();
    if (text) out.push(text);
  }
  return out;
}

function mergeParagraphs(paras: string[]): string[] {
  const result: string[] = [];
  let buf = "";
  for (const p of paras) {
    buf = buf ? `${buf} ${p}` : p;
    if (/[.!?»"]$/u.test(buf)) {
      result.push(buf);
      buf = "";
    }
  }
  if (buf) result.push(buf);
  return result;
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/u);
}

function extractDates(paragraphs: string[]): { birthDate: string | null; deathDate: string | null } {
  let birthDate: string | null = null;
  let deathDate: string | null = null;
  for (const para of paragraphs) {
    for (const sentence of splitSentences(para)) {
      const m = sentence.match(DATE_RE);
      if (!m) continue;
      if (!deathDate && DEATH_WORDS.some((w) => sentence.includes(w))) deathDate = toIsoDate(m);
      if (!birthDate && sentence.includes("народи")) birthDate = toIsoDate(m);
    }
  }
  return { birthDate, deathDate };
}

function extractCallsign(fullText: string): string | null {
  const m = fullText.slice(0, 200).match(CALLSIGN_RE);
  return m ? m[1]! : null;
}

/**
 * .docx — це ZIP. Читаємо лише "word/document.xml" через central directory,
 * без зовнішнього `unzip` (його немає у продовому образі) і без npm-залежностей.
 */
function extractZipEntry(buffer: Buffer, entryName: string): Buffer {
  const eocdSig = 0x06054b50;
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === eocdSig) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("не ZIP-файл (EOCD не знайдено)");

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(cdOffset) !== 0x02014b50) throw new Error("пошкоджений central directory");
    const compMethod = buffer.readUInt16LE(cdOffset + 10);
    const compSize = buffer.readUInt32LE(cdOffset + 20);
    const nameLen = buffer.readUInt16LE(cdOffset + 28);
    const extraLen = buffer.readUInt16LE(cdOffset + 30);
    const commentLen = buffer.readUInt16LE(cdOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(cdOffset + 42);
    const name = buffer.toString("utf-8", cdOffset + 46, cdOffset + 46 + nameLen);

    if (name === entryName) {
      const lhNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const lhExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lhNameLen + lhExtraLen;
      const compressed = buffer.subarray(dataStart, dataStart + compSize);
      if (compMethod === 0) return compressed;
      if (compMethod === 8) return inflateRawSync(compressed);
      throw new Error(`непідтримуваний метод стиснення: ${compMethod}`);
    }
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`entry "${entryName}" не знайдено в ${entryName}`);
}

async function readDocxParagraphs(filePath: string): Promise<string[]> {
  const buffer = await readFile(filePath);
  const xml = extractZipEntry(buffer, "word/document.xml").toString("utf-8");
  return mergeParagraphs(extractParagraphs(xml));
}

async function findOne(dir: string, predicate: (name: string) => boolean): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = entries.find((e) => e.isFile() && predicate(e.name));
  return found ? path.join(dir, found.name) : null;
}

async function generateDefenderPid(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.defender.count();
  for (let attempt = 0; attempt < 200; attempt++) {
    const pid = `MEM-${year}-${String(count + 1 + attempt).padStart(6, "0")}`;
    const exists = await prisma.defender.findUnique({ where: { pid }, select: { id: true } });
    if (!exists) return pid;
  }
  throw new Error("Не вдалося згенерувати унікальний PID");
}

async function uploadPortrait(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const sig = IMAGE_SIGNATURES.find((s) => s.match(buffer));
  if (!sig) throw new Error(`невідомий формат зображення: ${filePath}`);
  const checksum = createHash("sha256").update(buffer).digest("hex");

  const existing = await prisma.mediaAsset.findFirst({ where: { storageChecksum: checksum } });
  if (existing) return existing.id;

  const key = `${checksum}${sig.ext}`;
  await storagePut(key, buffer);

  const asset = await prisma.mediaAsset.create({
    data: {
      kind: "photo",
      title: path.basename(filePath).slice(0, 500),
      masterUri: key,
      storageChecksum: checksum,
      mimeType: sig.mime,
      fileSizeBytes: BigInt(buffer.length),
      rightsStatement: "Надано меморіалом «Меморіал Героїв» для публікації",
      status: "published",
    },
  });
  return asset.id;
}

async function main() {
  const admin = await prisma.appUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!DRY_RUN && !admin) throw new Error(`Адміністратора з email ${ADMIN_EMAIL} не знайдено`);

  let folders = (await readdir(ARCHIVE_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "uk"));
  if (ONLY) {
    const filters = ONLY.split(",");
    folders = folders.filter((f) => filters.some((s) => f.includes(s)));
  }

  console.log(`Знайдено ${folders.length} тек. Джерело: ${ARCHIVE_DIR}`);
  console.log(DRY_RUN ? "Режим: DRY RUN (нічого не пишемо)" : "Режим: ІМПОРТ (напряму через Prisma)");

  const rows: { folder: string; fullName: string; callsign: string | null; birthDate: string | null; deathDate: string | null; bioLen: number }[] = [];
  const errors: { folder: string; message: string }[] = [];

  for (const folder of folders) {
    const dir = path.join(ARCHIVE_DIR, folder);
    try {
      const docxPath = await findOne(dir, (n) => n.toLowerCase().endsWith(".docx"));
      const imagePath = await findOne(dir, (n) => /\.(jpe?g|png|webp)$/iu.test(n));
      if (!docxPath) throw new Error("немає .docx у теці");
      if (!imagePath) throw new Error("немає фото у теці");

      const paragraphs = await readDocxParagraphs(docxPath);
      const fullText = paragraphs.join(" ");
      const fullName = cleanFolderName(folder);
      const { birthDate, deathDate } = extractDates(paragraphs);
      const callsign = extractCallsign(fullText);
      const bio = paragraphs.join("\n\n");

      rows.push({ folder, fullName, callsign, birthDate, deathDate, bioLen: bio.length });

      if (!DRY_RUN) {
        const portraitMediaId = await uploadPortrait(imagePath);
        const pid = await generateDefenderPid();
        const defender = await prisma.defender.create({
          data: {
            pid,
            fullName,
            fullNameNormalized: fullName.toLowerCase(),
            birthDate: birthDate ? new Date(birthDate) : null,
            deathDate: deathDate ? new Date(deathDate) : null,
            bio,
            callsign,
            portraitMediaId,
            status: "published",
            verificationStatus: "verified",
            verifiedBy: admin!.id,
            verifiedAt: new Date(),
            createdBy: admin!.id,
          },
        });
        await prisma.auditLog.create({
          data: { actorId: admin!.id, action: "defender.import", entityType: "defender", entityId: defender.id, diff: { pid, fullName, source: "archive" } },
        });
        console.log(`✓ ${fullName} → ${pid}`);
      }
    } catch (err) {
      errors.push({ folder, message: (err as Error).message });
    }
  }

  console.log("\n=== ЗВЕДЕННЯ ===");
  console.log(`Оброблено: ${rows.length} / ${folders.length}`);
  console.log(`Без дати смерті: ${rows.filter((r) => !r.deathDate).length}`);
  console.log(`Без дати народження: ${rows.filter((r) => !r.birthDate).length}`);
  console.log(`Без псевдо: ${rows.filter((r) => !r.callsign).length}`);

  if (errors.length) {
    console.log(`\nПОМИЛКИ (${errors.length}):`);
    for (const e of errors) console.log(`  ✗ ${e.folder}: ${e.message}`);
  }

  if (DRY_RUN) {
    console.log("\n=== ПОВНИЙ СПИСОК (dry-run) ===");
    for (const r of rows) {
      console.log(`· ${r.fullName}${r.callsign ? ` («${r.callsign}»)` : ""} — народився: ${r.birthDate ?? "—"} | загинув: ${r.deathDate ?? "—"} | біо: ${r.bioLen} символів`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
