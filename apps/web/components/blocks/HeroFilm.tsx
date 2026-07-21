import { EmberCanvas } from "./EmberCanvas";
import { Reveal } from "../Reveal";
import { ButtonLink } from "../ui/Button";

/**
 * Кінематографічний хіро: живий фон жарин, тепла завіса свічки, велика
 * editorial-типографіка. Без скла, без сяйва навколо тексту — лише світло,
 * темрява й імена.
 */
export function HeroFilm({
  total,
  places,
}: {
  total: number | null;
  places: number | null;
}) {
  return (
    <section className="relative flex min-h-[100dvh] items-end overflow-hidden">
      {/* живий фон */}
      <div className="absolute inset-0">
        <EmberCanvas />
      </div>
      <div className="pointer-events-none absolute inset-0 candle-veil" />
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
