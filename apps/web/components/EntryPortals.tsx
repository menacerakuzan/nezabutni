import Link from "next/link";
import { Reveal } from "./Reveal";

interface Portal {
  href: string;
  label: string;
  meta: string;
  hue: string; // окремий глибокий відтінок панелі
}

/**
 * Портали-входи — головна навігація платформи як кінематографічний ряд панелей
 * (композиційно натхнено меморіальними інсталяціями). Без вигаданих світлин:
 * атмосферна глибина, тепле сяйво, велика типографіка.
 */
export function EntryPortals({ portals }: { portals: Portal[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {portals.map((p, i) => (
        <Reveal key={p.href} delay={i * 0.08}>
          <Link
            href={p.href}
            className="group relative flex h-[320px] flex-col justify-end overflow-hidden rounded-tile border border-hair p-6 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-hair-strong md:h-[420px]"
            style={{ background: p.hue }}
          >
            {/* тепле сяйво зверху, що яскравішає при наведенні */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-2/3 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(70% 60% at 50% 0%, rgba(223,155,59,0.22), transparent 70%)",
              }}
            />
            {/* нижнє затемнення для читабельності */}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
            <span className="relative">
              <span className="block text-[11px] uppercase text-gold-soft">
                {p.meta}
              </span>
              <span className="mt-2 block font-display text-2xl font-semibold text-cream md:text-3xl">
                {p.label}
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink transition-colors group-hover:text-cream">
                Увійти
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
