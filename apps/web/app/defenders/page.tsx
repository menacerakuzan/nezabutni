/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Reveal } from "../../components/Reveal";
import { formatDates } from "../../lib/mock-data";
import { DataUnavailable } from "../../components/DataUnavailable";
import { fetchDefenders, mediaUrl } from "../../lib/api";

export const metadata = { title: "Реєстр імен — Незабутні" };
export const revalidate = 30;

export default async function DefendersPage() {
  const result = await fetchDefenders({ limit: 1000 });
  const defenders = result.ok ? result.data : [];

  return (
    <>
      {/* Титр залу */}
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-36">
        <Reveal>
          <span className="caption">Стіна пам’яті</span>
          <h1 className="mt-6 font-display text-6xl font-semibold leading-[0.95] text-cream md:text-8xl">
            Реєстр імен
          </h1>
          <p className="mt-8 max-w-prose text-lg text-ink">
            Кожен рядок — окреме життя. Оберіть ім’я, щоб увійти до сторінки пам’яті: історія,
            служба, місця, голоси рідних.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <form action="/search" method="get" className="mt-10 flex max-w-lg items-center gap-3 border-b border-hair-strong pb-3">
            <input
              type="search"
              name="q"
              placeholder="Знайти за прізвищем чи іменем…"
              aria-label="Пошук за іменем"
              className="flex-1 border-0 bg-transparent px-0 text-lg text-cream placeholder:text-ink-faint focus:outline-none"
            />
            <button type="submit" className="text-sm text-gold transition-colors hover:text-gold-soft">
              Знайти →
            </button>
          </form>
        </Reveal>
      </section>

      {/* Реєстр як editorial-полотно великих імен */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        {!result.ok && <DataUnavailable />}
        {result.ok && defenders.length === 0 && (
          <DataUnavailable
            title="У реєстрі поки немає імен"
            hint="Щойно родини подадуть перші історії й модератори їх звірять, імена з’являться тут."
          />
        )}
        <ul className="border-t border-hair">
          {defenders.map((d, i) => (
            <Reveal as="li" key={d.pid} delay={(i % 8) * 0.03}>
              <Link
                href={`/defenders/${d.pid}`}
                className="group flex items-center justify-between gap-6 border-b border-hair py-8"
              >
                {d.portraitUrl ? (
                  <img
                    src={mediaUrl(d.portraitUrl)!}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 flex-none rounded-[3px] object-cover [filter:saturate(0.4)_contrast(1.05)_brightness(0.85)] transition-all duration-500 group-hover:[filter:saturate(0.8)_contrast(1.05)_brightness(1)]"
                  />
                ) : (
                  <div className="h-20 w-20 flex-none rounded-[3px] border border-hair bg-white/[0.02]" />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-3xl font-semibold uppercase leading-tight text-ink-lo transition-colors duration-300 group-hover:text-cream md:text-5xl">
                    {d.fullName}
                  </h2>
                  <p className="mt-2 text-sm text-ink-lo">
                    {formatDates(d.birthDate, d.deathDate)}
                    {d.unitName ? ` · ${d.unitName}` : ""}
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-2 text-sm text-ink-faint transition-all duration-300 group-hover:gap-3 group-hover:text-gold md:inline-flex">
                  Сторінка пам’яті →
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
