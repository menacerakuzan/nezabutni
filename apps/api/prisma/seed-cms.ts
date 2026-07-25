/**
 * Наповнення CMS-таблиць тим, що раніше було зашите в код фронтенду:
 * навігація, блоки головної сторінки, маршрут пам'яті.
 * Ідемпотентний — можна запускати повторно.
 */
import { PrismaClient } from "@prisma/client";

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

const HOME_BLOCKS = [
  ["FieldOfLights", "Поле вогнів (мапа області)"],
  ["ChapterManifest", "Маніфест «Ми зберігаємо людей»"],
  ["PhotoScene", "Фото-сцена «Вечір пам’яті»"],
  ["FullscreenQuote", "Цитата на весь екран"],
  ["CinematicStories", "Історії, які зберігають родини"],
  ["MemorialWall", "Стіна пам’яті"],
  ["PortalTiles", "Карта + Музей (портали)"],
  ["StoryCarousel", "Тексти пам’яті"],
  ["ContinueExploring", "Продовжити дослідження"],
  ["CtaHall", "Заклик «Подати ім’я»"],
] as const;

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
    const [blockType, label] = HOME_BLOCKS[i]!;
    const existing = await prisma.pageBlock.findFirst({ where: { page: "home", blockType } });
    if (!existing) {
      await prisma.pageBlock.create({
        data: { page: "home", blockType, label, sortOrder: i },
      });
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
