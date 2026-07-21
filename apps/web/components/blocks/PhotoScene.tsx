/* eslint-disable @next/next/no-img-element */
import { Reveal } from "../Reveal";

/**
 * Повноекранна фото-сцена — «зал» з одним великим кадром, повільним
 * Ken Burns і коротким титром. Емоційна пауза між главами експозиції.
 */
export function PhotoScene({
  src,
  alt = "",
  kicker,
  title,
  credit,
}: {
  src: string;
  alt?: string;
  kicker?: string;
  title?: string;
  credit?: string;
}) {
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="kenburns absolute inset-0 h-full w-full object-cover [filter:saturate(0.6)_contrast(1.05)_brightness(0.75)]"
      />
      <div className="pointer-events-none absolute inset-0 scrim-bottom" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-16">
        <Reveal>
          {kicker && <span className="caption">{kicker}</span>}
          {title && (
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.02] text-cream md:text-6xl [text-wrap:balance]">
              {title}
            </h2>
          )}
          {credit && <p className="mt-6 text-xs text-cream/40">{credit}</p>}
        </Reveal>
      </div>
    </section>
  );
}
