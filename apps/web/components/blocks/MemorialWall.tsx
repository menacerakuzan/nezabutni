import Link from "next/link";
import { Reveal } from "../Reveal";
import type { DefenderSummary } from "../../lib/types";

/**
 * Стіна пам’яті — імена як монумент, не картки. Великі імена вписані у
 * суцільне полотно; при наведенні одне ім'я «оживає». Ліворуч — тихий
 * лічильник, що надає масштабу жертві.
 */
export function MemorialWall({
  defenders,
  total,
}: {
  defenders: DefenderSummary[];
  total: number;
}) {
  return (
    <section className="border-y border-hair bg-navy-950">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[240px_1fr] lg:gap-20">
        <Reveal>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="caption">Стіна пам’яті</span>
            <div className="mt-4 font-display text-6xl font-semibold leading-none text-cream">
              {total}
            </div>
            <p className="mt-4 max-w-[16rem] text-sm text-ink">
              Стіна росте з кожним іменем. Ми не дозволимо жодному з них стати цифрою.
            </p>
            <Link
              href="/defenders"
              className="mt-6 inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-soft"
            >
              Уся стіна <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>

        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4">
          {defenders.map((d, i) => (
            <Reveal key={d.pid} as="span" delay={(i % 8) * 0.05}>
              <Link
                href={`/defenders/${d.pid}`}
                className="font-display text-3xl font-semibold uppercase leading-tight text-ink-lo transition-colors duration-300 hover:text-cream md:text-4xl"
              >
                {d.fullName}
                <span className="ml-3 align-middle text-base text-ink-faint">
                  {d.deathDate ? new Date(d.deathDate).getFullYear() : ""}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
