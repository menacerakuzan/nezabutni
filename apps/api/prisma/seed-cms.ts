/**
 * Наповнення CMS-таблиць тим, що раніше було зашите в код фронтенду:
 * навігація, блоки головної сторінки (разом із текстовим вмістом —
 * цитата, маніфест, підписи порталів), маршрут пам'яті.
 * Ідемпотентний — можна запускати повторно: не чіпає порядок/видимість,
 * які вже могли бути змінені в /admin/pages, і не перезаписує props,
 * якщо адмін їх уже редагував (лише додає, коли props ще порожні).
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const MENU = [
  ["header", "Реєстр", "/defenders"],
  ["header", "Карта", "/map"],
  ["header", "Музей", "/museum"],
  ["header", "Тексти", "/stories"],
  ["header", "Про нас", "/about"],
  ["footer_memorial", "Реєстр імен", "/defenders"],
  ["footer_memorial", "Карта пам’яті", "/map"],
  ["footer_memorial", "Онлайн-музей", "/museum"],
  ["footer_memorial", "Тексти пам’яті", "/stories"],
  ["footer_platform", "Про проєкт", "/about"],
  ["footer_platform", "Партнери", "/partners"],
  ["footer_platform", "Доступність", "/accessibility"],
  ["footer_platform", "Контакти", "/contacts"],
  ["footer_join", "Подати ім’я", "/submissions/new"],
  ["footer_join", "Підтримати", "/support"],
  ["footer_join", "Створити акаунт", "/register"],
] as const;

const HOME_BLOCKS: { type: string; label: string; props: Prisma.InputJsonValue }[] = [
  { type: "FieldOfLights", label: "Поле вогнів (мапа області)", props: {} },
  {
    type: "ChapterManifest",
    label: "Маніфест «Ми зберігаємо людей»",
    props: {
      index: "I",
      kicker: "Про що цей проєкт",
      title: "Ми зберігаємо не статистику. Ми зберігаємо людей.",
      lead1:
        "За кожним ім’ям — дитинство, професія, кохання, друзі, мрії. Людина, яка мала прожити довге життя, а натомість стала на його захист.",
      lead2:
        "Наше завдання — щоб через десятиліття нащадки могли подивитися їм в очі, почути їхні голоси й прочитати їхні історії. Не в підручнику, а тут, наживо.",
      aboutHref: "/about",
      aboutLabel: "Про меморіал",
    },
  },
  {
    type: "PhotoScene",
    label: "Фото-сцена «Вечір пам’яті»",
    props: {
      kicker: "Вечір пам’яті",
      title: "Світло не гасне, поки його передають далі.",
      credit: "Демонстраційний кадр · Pexels · у продакшні — власна зйомка меморіалів регіону",
    },
  },
  {
    type: "FullscreenQuote",
    label: "Цитата на весь екран",
    props: {
      quote: "Коли мене запитують, що таке війна, я без роздуму відповім: імена.",
      author: "Максим Кривцов",
      role: "поет і воїн",
    },
  },
  {
    type: "CinematicStories",
    label: "Історії, які зберігають родини",
    props: {
      index: "II",
      kicker: "Історії пам’яті",
      title: "Історії, які зберігають родини",
      lead: "Кожну сторінку тут створюють рідні й побратими. Це їхні слова та їхня пам’ять.",
    },
  },
  { type: "MemorialWall", label: "Стіна пам’яті", props: {} },
  {
    type: "PortalTiles",
    label: "Карта + Музей (портали)",
    props: {
      index: "IV",
      kicker: "Простір пам’яті",
      title: "Пам’ять має географію й обличчя",
      mapTitle: "Карта пам’яті",
      mapText: "Місця боїв, меморіали й маршрути на інтерактивній карті регіону.",
      mapCta: "Відкрити карту →",
      museumTitle: "Онлайн-музей",
      museumText: "Експозиції, документи й особисті речі — цифрова виставка пам’яті.",
      museumCta: "Увійти до музею →",
    },
  },
  {
    type: "StoryCarousel",
    label: "Тексти пам’яті",
    props: { index: "V", kicker: "Тексти пам’яті", title: "Історії, розказані словами" },
  },
  {
    type: "ContinueExploring",
    label: "Продовжити дослідження",
    props: {
      paths: [
        { href: "/defenders", index: "→", title: "Реєстр імен", note: "Уся стіна пам’яті" },
        { href: "/museum", index: "→", title: "Онлайн-музей", note: "Експозиції та документи" },
        { href: "/submissions/new", index: "→", title: "Подати ім’я", note: "Додати історію захисника" },
      ],
    },
  },
  {
    type: "CtaHall",
    label: "Заклик «Подати ім’я»",
    props: {
      title: "Знаєте захисника, чиє ім’я має світити тут?",
      body: "Розкажіть його історію. Після верифікації вона стане частиною меморіалу — назавжди.",
      buttonLabel: "Подати ім’я",
      buttonHref: "/submissions/new",
    },
  },
];

function isEmptyProps(props: Prisma.JsonValue | null): boolean {
  return props === null || (typeof props === "object" && props !== null && Object.keys(props).length === 0);
}

async function main() {
  for (const [location, label, href] of MENU) {
    const existing = await prisma.menuItem.findFirst({ where: { location, href } });
    if (!existing) {
      await prisma.menuItem.create({
        data: { location, label, href, sortOrder: MENU.findIndex((m) => m[2] === href && m[0] === location) },
      });
    }
  }

  for (let i = 0; i < HOME_BLOCKS.length; i++) {
    const { type: blockType, label, props } = HOME_BLOCKS[i]!;
    const existing = await prisma.pageBlock.findFirst({ where: { page: "home", blockType } });
    if (!existing) {
      await prisma.pageBlock.create({ data: { page: "home", blockType, label, sortOrder: i, props } });
    } else if (isEmptyProps(existing.props)) {
      // Рядок уже існував без реального props (null або порожній {} зі
      // старого сіду) — донаповнюємо текстом, не чіпаючи sortOrder/visible,
      // які міг змінити адміністратор.
      await prisma.pageBlock.update({ where: { id: existing.id }, data: { props } });
    }
  }

  // Маршрут пам'яті з реальних місць у БД
  const places = await prisma.place.findMany({ take: 3, orderBy: { name: "asc" } });
  if (places.length) {
    let route = await prisma.memoryRoute.findFirst({ where: { slug: "pivdennyi-rubizh" } });
    if (!route) {
      route = await prisma.memoryRoute.create({
        data: {
          title: "Південний рубіж",
          slug: "pivdennyi-rubizh",
          description: "Місця пам’яті регіону — кінематографічний обліт.",
          status: "published",
        },
      });
      await prisma.memoryRoutePlace.createMany({
        data: places.map((p, i) => ({ routeId: route!.id, placeId: p.id, seqOrder: i })),
      });
    }
  }

  console.log({
    menu: await prisma.menuItem.count(),
    blocks: await prisma.pageBlock.count(),
    routes: await prisma.memoryRoute.count(),
  });
}

main().finally(() => prisma.$disconnect());
