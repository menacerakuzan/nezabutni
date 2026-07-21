import Link from "next/link";
import { Reveal } from "../Reveal";

interface Path {
  href: string;
  index: string;
  title: string;
  note: string;
}

/**
 * «Продовжити дослідження» — маршрут музею. Не футер-меню, а запрошення
 * піти далі: до карти, до архіву, до наступної історії.
 */
export function ContinueExploring({ paths }: { paths: Path[] }) {
  return (
    <section className="border-t border-hair">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <span className="caption">Продовжити дослідження</span>
        </Reveal>
        <div className="mt-8 divide-y divide-hair border-y border-hair">
          {paths.map((p, i) => (
            <Reveal key={p.href} delay={i * 0.05}>
              <Link
                href={p.href}
                className="group flex items-center gap-6 py-7 transition-colors hover:bg-white/[0.02]"
              >
                <span className="font-display text-sm text-gold">{p.index}</span>
                <span className="flex-1">
                  <span className="block font-display text-2xl font-semibold text-cream transition-colors group-hover:text-gold md:text-3xl">
                    {p.title}
                  </span>
                  <span className="mt-1 block text-sm text-ink-lo">{p.note}</span>
                </span>
                <span className="text-2xl text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-cream">
                  →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
