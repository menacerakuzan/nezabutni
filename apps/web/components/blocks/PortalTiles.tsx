import Link from "next/link";
import { ChapterIntro } from "./ChapterIntro";
import { MediaFrame } from "./MediaFrame";
import { Reveal } from "../Reveal";
import { MEDIA } from "../../lib/media";

export interface PortalTilesProps {
  index?: string;
  kicker?: string;
  title?: string;
  mapTitle?: string;
  mapText?: string;
  mapCta?: string;
  museumTitle?: string;
  museumText?: string;
  museumCta?: string;
}

const D: Required<PortalTilesProps> = {
  index: "IV",
  kicker: "Простір пам’яті",
  title: "Пам’ять має географію й обличчя",
  mapTitle: "Карта пам’яті",
  mapText: "Місця боїв, меморіали й маршрути на інтерактивній карті регіону.",
  mapCta: "Відкрити карту →",
  museumTitle: "Онлайн-музей",
  museumText: "Експозиції, документи й особисті речі — цифрова виставка пам’яті.",
  museumCta: "Увійти до музею →",
};

/** Зал IV: портали до карти й музею. Текст редагується в /admin/pages. */
export function PortalTiles(props: PortalTilesProps) {
  const p = { ...D, ...props };
  return (
    <>
      <ChapterIntro index={p.index} kicker={p.kicker} title={p.title} />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-3 md:grid-cols-2">
          <Reveal>
            <Link href="/map" className="group relative block overflow-hidden">
              <MediaFrame
                caption="Одеса · прапори на фасаді"
                src={MEDIA.odesaFlags}
                alt="Фасад будинку в Одесі з українськими прапорами"
                aspect="aspect-[4/3]"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-8">
                <h3 className="font-display text-3xl font-semibold text-cream md:text-4xl">
                  {p.mapTitle}
                </h3>
                <p className="mt-2 max-w-xs text-sm text-ink">{p.mapText}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold transition-all group-hover:gap-3">
                  {p.mapCta}
                </span>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <Link href="/museum" className="group relative block overflow-hidden">
              <MediaFrame
                caption="Експонат · рамка зі світлиною"
                src={MEDIA.framedPhoto}
                alt="Фотографія в рамці поруч зі свічками"
                aspect="aspect-[4/3]"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-8">
                <h3 className="font-display text-3xl font-semibold text-cream md:text-4xl">
                  {p.museumTitle}
                </h3>
                <p className="mt-2 max-w-xs text-sm text-ink">{p.museumText}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold transition-all group-hover:gap-3">
                  {p.museumCta}
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
