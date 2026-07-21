"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "../Reveal";
import { ButtonLink } from "../ui/Button";

/**
 * Кінематографічний хіро з відео-фоном (свічки у темряві), приглушеним
 * шарами темно-синього, бордо й чорного — щоб кадри читалися як атмосфера,
 * а не як реклама. Демонстраційне відео: Pexels (Alyona Nagel), CC0-подібна
 * ліцензія free-to-use. У продакшні замінюється на власний матеріал.
 */
const VIDEO_SRC = "https://videos.pexels.com/video-files/27897502/12256196_1080_1920_30fps.mp4";

export function HeroVideo({
  total,
  places,
}: {
  total: number | null;
  places: number | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      v.removeAttribute("autoplay");
      v.pause();
    } else {
      v.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative flex min-h-[100dvh] items-end overflow-hidden bg-black">
      {/* відео-фон */}
      <video
        ref={ref}
        className="kenburns absolute inset-0 h-full w-full object-cover opacity-[0.6]"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      {/* шари атмосфери */}
      <div className="pointer-events-none absolute inset-0 candle-veil" />
      <div className="pointer-events-none absolute inset-0 scrim-sides" />
      <div className="pointer-events-none absolute inset-0 scrim-bottom" />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 md:pb-28">
        <Reveal>
          <span className="caption">Цифровий меморіал захисників регіону</span>
        </Reveal>
        <Reveal delay={0.1} y={32}>
          <h1 className="mt-6 max-w-4xl font-display font-semibold leading-[0.95] text-cream [text-wrap:balance]">
            <span className="block text-[clamp(2.8rem,8vw,7rem)]">Кожне ім’я</span>
            <span className="block text-[clamp(2.8rem,8vw,7rem)]">
              світить у <span className="text-gold">темряві</span>.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink">
            Цифровий меморіал і музей пам’яті. Ми зберігаємо обличчя, голоси й шляхи тих, хто
            наблизив свободу — щоб пам’ять не згасла.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="/defenders" variant="solid">
              Увійти до меморіалу
            </ButtonLink>
            <ButtonLink href="/submissions/new" variant="line">
              Подати ім’я
            </ButtonLink>
          </div>
        </Reveal>
        {total !== null && (
          <Reveal delay={0.4}>
            <p className="mt-14 text-sm text-ink-lo">
              <b className="font-semibold text-cream">{total}</b> імен збережено
              {places !== null && (
                <>
                  {" · "}
                  <b className="font-semibold text-cream">{places}</b> місць пам’яті на карті
                </>
              )}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
