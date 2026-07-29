"use client";

import { useEffect, useState } from "react";
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

function pickRandom(defenders: DefenderSummary[], n: number): DefenderSummary[] {
  const pool = [...defenders];
  const picked: DefenderSummary[] = [];
  while (picked.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]!);
  }
  return picked;
}

/**
 * Зал II: 3 випадкові історії з реєстру — інші при кожному заході, а не
 * завжди ті самі перші за датою. Вибір — на клієнті (useEffect), щоб
 * справді відрізнявся щоразу, а не лише раз на ISR-цикл кешування.
 */
export function CinematicStories({
  defenders,
  ...props
}: CinematicStoriesProps & { defenders: DefenderSummary[] }) {
  const p = { ...D, ...props };
  // До монтування — перші за датою (детерміновано, без розбіжності SSR/клієнт).
  const [shown, setShown] = useState<DefenderSummary[]>(() => defenders.slice(0, 3));

  useEffect(() => {
    if (defenders.length > 3) setShown(pickRandom(defenders, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (shown.length === 0) return null;

  return (
    <>
      <ChapterIntro index={p.index} kicker={p.kicker} title={p.title} lead={p.lead} />
      {shown.map((d, i) => (
        <CinematicStory key={d.pid} defender={d} flip={i % 2 === 1} />
      ))}
    </>
  );
}
