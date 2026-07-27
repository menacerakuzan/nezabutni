import { ChapterIntro } from "./ChapterIntro";
import { CinematicStory } from "./CinematicStory";
import type { DefenderSummary } from "../../lib/types";

export interface CinematicStoriesProps {
  index?: string;
  kicker?: string;
  title?: string;
  lead?: string;
}

const D: Required<CinematicStoriesProps> = {
  index: "II",
  kicker: "Історії пам’яті",
  title: "Історії, які зберігають родини",
  lead: "Кожну сторінку тут створюють рідні й побратими. Це їхні слова та їхня пам’ять.",
};

/**
 * Зал II: дві останні історії з реєстру. Текст заголовка редагується
 * в /admin/pages; самі історії — завжди реальні записи з БД.
 */
export function CinematicStories({
  defenders,
  ...props
}: CinematicStoriesProps & { defenders: DefenderSummary[] }) {
  const p = { ...D, ...props };
  const [featured, second] = defenders;
  if (!featured) return null;

  return (
    <>
      <ChapterIntro index={p.index} kicker={p.kicker} title={p.title} lead={p.lead} />
      <CinematicStory defender={featured} />
      {second && <CinematicStory defender={second} flip />}
    </>
  );
}
