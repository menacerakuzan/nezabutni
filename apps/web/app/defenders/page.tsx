/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Reveal } from "../../components/Reveal";
import { formatDates } from "../../lib/mock-data";
import { DataUnavailable } from "../../components/DataUnavailable";
import { fetchDefenders, fetchFacets, mediaUrl } from "../../lib/api";

export const metadata = { title: "Реєстр імен — Незабутні" };
export const revalidate = 30;

export default async function DefendersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; unit_id?: string; region_id?: string }>;
}) {
  const { q, unit_id: unitId, region_id: regionId } = await searchParams;
  const [result, facets] = await Promise.all([
    fetchDefenders({ q, unitId, regionId, limit: 1000 }),
    fetchFacets(),
  ]);
  const defenders = result.ok ? result.data : [];
  const hasFilters = Boolean(q || unitId || regionId);

  return (
    <>
      {/* Титр залу */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-36">
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
          <form action="/defenders" method="get" className="mt-10 max-w-2xl">
            <div className="flex items-center gap-3 border-b border-hair-strong pb-3">
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Знайти за прізвищем чи іменем…"
                aria-label="Пошук за іменем"
                className="flex-1 border-0 bg-transparent px-0 text-lg text-cream placeholder:text-ink-faint focus:outline-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="f-unit" className="block text-xs text-ink-lo">
                  Частина
                </label>
                <select
                  id="f-unit"
                  name="unit_id"
                  defaultValue={unitId ?? ""}
                  className="mt-1 min-w-[220px] rounded-[3px] border border-hair bg-transparent px-2 py-2 text-sm text-cream"
                >
                  <option value="">Усі частини</option>
                  {facets.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-region" className="block text-xs text-ink-lo">
                  Район (за місцем народження)
                </label>
                <select
                  id="f-region"
                  name="region_id"
                  defaultValue={regionId ?? ""}
                  className="mt-1 min-w-[200px] rounded-[3px] border border-hair bg-transparent px-2 py-2 text-sm text-cream"
                >
                  <option value="">Усі райони</option>
                  {facets.regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-[3px] bg-cream px-5 py-2 text-sm font-semibold text-void hover:bg-white"
              >
                Знайти →
              </button>
              {hasFilters && (
                <Link href="/defenders" className="text-sm text-ink-lo hover:text-cream">
                  Скинути фільтри
                </Link>
              )}
            </div>
          </form>
        </Reveal>
      </section>

      {/* Реєстр як editorial-полотно великих імен */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        {!result.ok && <DataUnavailable />}
        {result.ok && defenders.length === 0 && (
          <DataUnavailable
            title={hasFilters ? "За цим фільтром нікого не знайдено" : "У реєстрі поки немає імен"}
            hint={
              hasFilters
                ? "Спробуйте змінити або скинути фільтри."
                : "Щойно родини подадуть перші історії й модератори їх звірять, імена з’являться тут."
            }
          />
        )}
        {result.ok && defenders.length > 0 && (
          <p className="border-t border-hair pt-4 text-xs text-ink-lo">
            {defenders.length} {hasFilters ? "знайдено" : "у реєстрі"}
          </p>
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
                    {d.regionName ? ` · ${d.regionName} район` : ""}
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
