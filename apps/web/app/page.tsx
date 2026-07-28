import { FieldOfLights } from "../components/field/FieldOfLights";
import { ChapterManifest, type ChapterManifestProps } from "../components/blocks/ChapterManifest";
import { PhotoScene } from "../components/blocks/PhotoScene";
import { FullscreenQuote } from "../components/blocks/FullscreenQuote";
import { CinematicStories, type CinematicStoriesProps } from "../components/blocks/CinematicStories";
import { MemorialWall } from "../components/blocks/MemorialWall";
import { PortalTiles, type PortalTilesProps } from "../components/blocks/PortalTiles";
import { StoryCarouselSection, type StoryCarouselSectionProps } from "../components/blocks/StoryCarouselSection";
// blockType у БД лишився "StoryCarousel" (історична назва з першого сіду);
// компонент перейменовано на StoryCarouselSection при виділенні в блок-реєстр.
import { ContinueExploring } from "../components/blocks/ContinueExploring";
import { CtaHall, type CtaHallProps } from "../components/blocks/CtaHall";
import { MEDIA } from "../lib/media";
import { formatDates } from "../lib/mock-data";
import { fetchDefenders, fetchStats, fetchPageBlocks, type PageBlockDto } from "../lib/api";
import { DataUnavailable } from "../components/DataUnavailable";
import type { DefenderSummary } from "../lib/types";

export const revalidate = 30;

/**
 * Головна — послідовність блоків, керована з /admin/pages (порядок,
 * видимість, текст у page_block.props). Якщо CMS-таблиця порожня чи
 * недоступна, сторінка не ламається — DEFAULT_BLOCKS відтворює той самий
 * маршрут, що й раніше було зашито прямо в JSX.
 */
const DEFAULT_BLOCKS: PageBlockDto[] = [
  { id: "d-field", type: "FieldOfLights", label: "Поле вогнів", props: {} },
  { id: "d-manifest", type: "ChapterManifest", label: "Маніфест", props: {} },
  { id: "d-scene", type: "PhotoScene", label: "Фото-сцена", props: {} },
  { id: "d-quote", type: "FullscreenQuote", label: "Цитата", props: {} },
  { id: "d-stories", type: "CinematicStories", label: "Історії", props: {} },
  { id: "d-wall", type: "MemorialWall", label: "Стіна пам’яті", props: {} },
  { id: "d-portals", type: "PortalTiles", label: "Портали", props: {} },
  { id: "d-carousel", type: "StoryCarousel", label: "Тексти пам’яті", props: {} },
  { id: "d-continue", type: "ContinueExploring", label: "Продовжити", props: {} },
  { id: "d-cta", type: "CtaHall", label: "Заклик", props: {} },
];

const DEFAULT_PATHS = [
  { href: "/defenders", index: "→", title: "Реєстр імен", note: "Уся стіна пам’яті" },
  { href: "/museum", index: "→", title: "Онлайн-музей", note: "Експозиції та документи" },
  { href: "/submissions/new", index: "→", title: "Подати ім’я", note: "Додати історію захисника" },
];

export default async function HomePage() {
  const [defendersResult, statsResult, blocksResult] = await Promise.all([
    fetchDefenders({ limit: 1000 }),
    fetchStats(),
    fetchPageBlocks("home"),
  ]);
  const latest = defendersResult.ok ? defendersResult.data : [];
  const stats = statsResult.ok ? statsResult.data : null;
  const blocks = blocksResult.ok && blocksResult.data.length ? blocksResult.data : DEFAULT_BLOCKS;

  // Реєстр недоступний — кажемо про це прямо, а не показуємо демо-імена
  if (!defendersResult.ok) {
    return (
      <div className="mx-auto max-w-6xl px-6 pt-40">
        <DataUnavailable />
      </div>
    );
  }

  return (
    <>
      {blocks.map((block) => (
        <HomeBlock key={block.id} block={block} latest={latest} totalStats={stats?.total} />
      ))}
    </>
  );
}

function HomeBlock({
  block,
  latest,
  totalStats,
}: {
  block: PageBlockDto;
  latest: DefenderSummary[];
  totalStats?: number;
}) {
  const props = block.props ?? {};

  switch (block.type) {
    case "FieldOfLights":
      return (
        <FieldOfLights
          real={latest.map((d) => ({
            pid: d.pid,
            name: d.fullName,
            years: formatDates(d.birthDate, d.deathDate),
            region: d.regionName,
            lon: d.lon,
            lat: d.lat,
          }))}
        />
      );

    case "ChapterManifest":
      return <ChapterManifest {...(props as ChapterManifestProps)} />;

    case "PhotoScene":
      return (
        <PhotoScene
          src={MEDIA.cemeteryLanterns}
          alt="Лампадки пам’яті у вечірній темряві"
          kicker={(props.kicker as string) ?? "Вечір пам’яті"}
          title={(props.title as string) ?? "Світло не гасне, поки його передають далі."}
          credit={
            (props.credit as string) ??
            "Демонстраційний кадр · Pexels · у продакшні — власна зйомка меморіалів регіону"
          }
        />
      );

    case "FullscreenQuote":
      return (
        <FullscreenQuote
          quote={(props.quote as string) ?? "Коли мене запитують, що таке війна, я без роздуму відповім: імена."}
          author={(props.author as string) ?? "Максим Кривцов"}
          role={(props.role as string) ?? "поет і воїн"}
        />
      );

    case "CinematicStories":
      return <CinematicStories defenders={latest} {...(props as CinematicStoriesProps)} />;

    case "MemorialWall":
      return <MemorialWall defenders={latest} total={totalStats ?? latest.length} />;

    case "PortalTiles":
      return <PortalTiles {...(props as PortalTilesProps)} />;

    case "StoryCarousel":
      return <StoryCarouselSection {...(props as StoryCarouselSectionProps)} />;

    case "ContinueExploring":
      return <ContinueExploring paths={(props.paths as typeof DEFAULT_PATHS) ?? DEFAULT_PATHS} />;

    case "CtaHall":
      return <CtaHall {...(props as CtaHallProps)} />;

    default:
      // Невідомий тип блока (наприклад, ще не реалізований) — тихо пропускаємо,
      // щоб одна помилка конфігурації не клала всю сторінку.
      return null;
  }
}
