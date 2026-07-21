import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/password.util";

const prisma = new PrismaClient();

function normalize(s: string): string {
  return s.toLowerCase();
}

const ROLES = [
  { id: 1, code: "viewer", nameUk: "Відвідувач" },
  { id: 2, code: "editor", nameUk: "Контент-менеджер" },
  { id: 3, code: "moderator", nameUk: "Модератор" },
  { id: 4, code: "archivist", nameUk: "Архіваріус" },
  { id: 5, code: "verifier_gov", nameUk: "Верифікатор (ВА/ТЦК)" },
  { id: 6, code: "partner_curator", nameUk: "Куратор партнера" },
  { id: 7, code: "admin", nameUk: "Адміністратор" },
  { id: 8, code: "superadmin", nameUk: "Суперадміністратор" },
];

async function setPlaceGeom(placeId: string, lon: number, lat: number) {
  await prisma.$executeRawUnsafe(
    `UPDATE "place" SET "geom_point" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3::uuid`,
    lon,
    lat,
    placeId,
  );
}

async function main() {
  // ---------- Ролі ----------
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { id: r.id }, update: {}, create: r });
  }

  // ---------- Користувачі ----------
  const admin = await prisma.appUser.create({
    data: {
      authSubject: "dev:admin",
      email: "admin@memorial.dev",
      displayName: "Адміністратор Платформи",
      passwordHash: hashPassword("admin12345"),
      status: "active",
    },
  });
  const editor = await prisma.appUser.create({
    data: {
      authSubject: "dev:editor",
      email: "editor@memorial.dev",
      displayName: "Марія Контент-менеджер",
      passwordHash: hashPassword("editor12345"),
      status: "active",
    },
  });
  const family = await prisma.appUser.create({
    data: {
      authSubject: "dev:family",
      email: "oksana@example.com",
      displayName: "Оксана (сестра захисника)",
      passwordHash: hashPassword("family12345"),
      status: "active",
    },
  });

  await prisma.userRole.create({ data: { userId: admin.id, roleId: 8 } }); // superadmin
  await prisma.userRole.create({ data: { userId: editor.id, roleId: 2 } }); // editor

  // ---------- Регіон / підрозділи ----------
  const region = await prisma.region.create({ data: { name: "Одеська область", level: 1 } });

  const unit128 = await prisma.unit.create({ data: { name: "128-ма окрема гірсько-штурмова бригада" } });
  const unit28 = await prisma.unit.create({ data: { name: "28-ма окрема механізована бригада" } });
  const unit126 = await prisma.unit.create({ data: { name: "126-та окрема бригада територіальної оборони" } });
  const unit73 = await prisma.unit.create({ data: { name: "73-й морський центр спеціальних операцій" } });

  // ---------- Місця (з геометрією PostGIS) ----------
  const memorialPlace = await prisma.place.create({
    data: {
      type: "memorial",
      name: "Меморіал пам’яті захисників",
      slug: "memorial-odesa-central",
      description: "Демонстраційна точка для карти пам’яті.",
      regionId: region.id,
      status: "published",
    },
  });
  await setPlaceGeom(memorialPlace.id, 30.7233, 46.4825);

  const battlePlace = await prisma.place.create({
    data: {
      type: "battle",
      name: "Позиції під Роботиним",
      slug: "battle-robotyne",
      description: "Демонстраційна точка боїв (орієнтовна локація).",
      regionId: region.id,
      status: "published",
    },
  });
  await setPlaceGeom(battlePlace.id, 35.8397, 47.4592);

  // ---------- Захисники ----------
  const defendersData = [
    {
      pid: "MEM-2026-000101",
      fullName: "Іваненко Олег Петрович",
      callsign: "Беркут",
      birthDate: new Date("1989-04-12"),
      deathDate: new Date("2024-01-28"),
      unitId: unit128.id,
      bio: "Народився в Одесі, до війни працював інженером. Пішов добровольцем у перші дні повномасштабного вторгнення.",
      verificationStatus: "verified" as const,
      guardianUserId: family.id,
    },
    {
      pid: "MEM-2026-000102",
      fullName: "Ковальчук Андрій Миколайович",
      callsign: null,
      birthDate: new Date("1995-09-03"),
      deathDate: new Date("2023-11-14"),
      unitId: unit28.id,
      bio: "Закінчив Одеську політехніку. Захищав Бахмутський напрямок у складі механізованого підрозділу.",
      verificationStatus: "verified" as const,
      guardianUserId: null,
    },
    {
      pid: "MEM-2026-000103",
      fullName: "Мельник Тарас Ігорович",
      callsign: "Сокіл",
      birthDate: new Date("1992-02-20"),
      deathDate: new Date("2024-06-07"),
      unitId: unit126.id,
      bio: "Вчитель фізики за освітою. Загинув, прикриваючи відхід побратимів під Роботиним.",
      verificationStatus: "pending" as const,
      guardianUserId: null,
    },
    {
      pid: "MEM-2026-000104",
      fullName: "Бондаренко Сергій Валерійович",
      callsign: "Хмара",
      birthDate: new Date("1987-12-01"),
      deathDate: new Date("2023-08-22"),
      unitId: unit73.id,
      bio: "Кадровий військовослужбовець, служив з 2014 року. Нагороджений орденом «За мужність» III ступеня.",
      verificationStatus: "verified" as const,
      guardianUserId: null,
    },
  ];

  const defenders = [];
  for (const d of defendersData) {
    const created = await prisma.defender.create({
      data: {
        pid: d.pid,
        fullName: d.fullName,
        fullNameNormalized: normalize(d.fullName),
        callsign: d.callsign,
        birthDate: d.birthDate,
        deathDate: d.deathDate,
        unitId: d.unitId,
        regionId: region.id,
        bio: d.bio,
        verificationStatus: d.verificationStatus,
        guardianUserId: d.guardianUserId,
        status: "published",
        candleCount: 0,
        createdBy: editor.id,
      },
    });
    defenders.push(created);
  }

  const [defOleg, , defTaras] = defenders;

  await prisma.defenderPlaceRole.create({
    data: { defenderId: defOleg!.id, placeId: memorialPlace.id, role: "buried_at" },
  });
  await prisma.defenderPlaceRole.create({
    data: { defenderId: defTaras!.id, placeId: battlePlace.id, role: "died_at" },
  });

  await prisma.defenderAward.create({
    data: {
      defenderId: defOleg!.id,
      title: "Орден «За мужність» III ступеня",
      awardedDate: new Date("2024-03-01"),
    },
  });

  // ---------- Архів (медіа) ----------
  const media = await prisma.mediaAsset.create({
    data: {
      kind: "document",
      title: "Лист з фронту (демо-скан)",
      description: "Демонстраційний архівний документ для перевірки модуля Archive.",
      masterUri: "s3://memorial-dev/demo/letter-001.jpg",
      storageChecksum: "demo-checksum-0000000000000000000000000000000000000000000000000000000000000000",
      mimeType: "image/jpeg",
      ocrText: "Дорога мамо, у нас все добре, не хвилюйся. Скоро побачимось.",
      ocrLang: "uk",
      rightsStatement: "CC-BY",
      status: "published",
      uploadedBy: editor.id,
    },
  });

  // ---------- Музей: партнер / колекція / експозиція ----------
  const partner = await prisma.partner.create({
    data: { name: "Одеський обласний краєзнавчий музей", type: "museum", status: "active" },
  });
  const collection = await prisma.collection.create({
    data: {
      partnerId: partner.id,
      title: "Особисті речі захисників 2022–2024",
      slug: "personal-items-2022-2024",
      description: "Демонстраційна колекція для модуля онлайн-музею.",
      status: "published",
    },
  });
  const exhibit = await prisma.exhibit.create({
    data: {
      collectionId: collection.id,
      title: "Пам’ять у деталях",
      slug: "memory-in-details",
      summary: "Демонстраційна експозиція: особисті речі й документи захисників регіону.",
      blocks: [
        { type: "text", body: "Ця експозиція обʼєднує особисті речі, листи й фотографії." },
        { type: "quote", body: "«Памʼять — це те, що ми залишаємо один одному»" },
      ],
      status: "published",
      curatorId: editor.id,
      publishedAt: new Date(),
    },
  });
  await prisma.exhibitDefender.create({ data: { exhibitId: exhibit.id, defenderId: defOleg!.id } });

  // ---------- Тексти пам’яті (Story) ----------
  const storiesData = [
    {
      title: "Боевий шлях 128-ї бригади: хроніка 2023–2024",
      slug: "128-brigade-timeline-2023-2024",
      summary: "Демонстраційна кураторська історія з таймлайном.",
      timeline: [
        { date: "2023-02-01", title: "Формування бригади", body: "Демо-подія таймлайну." },
        { date: "2024-01-28", title: "Втрата побратима", body: "Демо-подія таймлайну." },
      ],
    },
    {
      title: "Позивний «Беркут»: історія одного побратимства",
      slug: "callsign-berkut-brotherhood",
      summary: "Демонстраційна історія про побратимів одного підрозділу.",
      timeline: [{ date: "2022-03-01", title: "Перший бій", body: "Демо-подія таймлайну." }],
    },
    {
      title: "Одеса памʼятає: місця, повʼязані з обороною міста",
      slug: "odesa-remembers-defense-sites",
      summary: "Демонстраційний огляд ключових точок оборони регіону.",
      timeline: [{ date: "2022-02-24", title: "Початок вторгнення", body: "Демо-подія таймлайну." }],
    },
  ];
  for (const s of storiesData) {
    await prisma.story.create({
      data: {
        title: s.title,
        slug: s.slug,
        summary: s.summary,
        blocks: [{ type: "text", body: "Демонстраційний текст історії пам’яті." }],
        timeline: s.timeline,
        status: "published",
        authorId: editor.id,
        publishedAt: new Date(),
      },
    });
  }

  // ---------- UGC: спогад на модерації ----------
  await prisma.memoryUgc.create({
    data: {
      defenderId: defOleg!.id,
      authorUserId: family.id,
      body: "Олег завжди був опорою для всієї родини. Ми пишаємось ним.",
      status: "pending",
    },
  });

  // ---------- Заявка на верифікацію (демо, очікує розгляду) ----------
  await prisma.defenderSubmission.create({
    data: {
      submittedBy: family.id,
      payload: {
        fullName: "Приходько Віктор Олексійович",
        birthDate: "1990-05-15",
        deathDate: "2024-03-10",
        birthPlace: "м. Одеса",
      },
      attachedMediaIds: [],
      status: "pending",
    },
  });

  console.log("Seed complete:", {
    users: 3,
    roles: ROLES.length,
    defenders: defenders.length,
    places: 2,
    media: 1,
    exhibits: 1,
    stories: 1,
    memories: 1,
    submissions: 1,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
