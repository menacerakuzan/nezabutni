import { ChapterIntro } from "./ChapterIntro";
import { StoryCarousel } from "../StoryCarousel";
import { Reveal } from "../Reveal";

export interface StoryCarouselSectionProps {
  index?: string;
  kicker?: string;
  title?: string;
}

const D: Required<StoryCarouselSectionProps> = {
  index: "V",
  kicker: "Тексти пам’яті",
  title: "Історії, розказані словами",
};

/** Зал V: тексти пам’яті (карусель сама тягне дані з /stories). */
export function StoryCarouselSection(props: StoryCarouselSectionProps) {
  const p = { ...D, ...props };
  return (
    <>
      <ChapterIntro index={p.index} kicker={p.kicker} title={p.title} />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <StoryCarousel />
        </Reveal>
      </section>
    </>
  );
}
