"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { Reveal } from "../Reveal";
import type { DefenderSummary } from "../../lib/types";

/**
 * Стіна пам’яті — імена як монумент, не картки. Компактна стрічка в один
 * рядок: за спокою видно перші імена, при наведенні стрічка сама їде
 * праворуч, показуючи решту — так усі 100+ імен влазять, не розтягуючи
 * секцію на весь екран вертикально.
 */
export function MemorialWall({
  defenders,
  total,
}: {
  defenders: DefenderSummary[];
  total: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    const track = trackRef.current;
    if (!track || rafRef.current !== null) return;
    const halfWidth = track.scrollWidth / 2;
    const step = () => {
      track.scrollLeft += 1.1;
      if (track.scrollLeft >= halfWidth) track.scrollLeft -= halfWidth;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  // Дублюємо список один раз підряд — коли доїжджаємо до половини,
  // непомітно повертаємось на 0: стрічка "нескінченна", без стрибка.
  const doubled = defenders.length > 0 ? [...defenders, ...defenders] : [];

  return (
    <section className="border-y border-hair bg-navy-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:gap-16">
        <Reveal>
          <div className="shrink-0">
            <span className="caption">Стіна пам’яті</span>
            <div className="mt-3 flex items-baseline gap-4">
              <span className="font-display text-5xl font-semibold leading-none text-cream">{total}</span>
              <Link
                href="/defenders"
                className="inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-soft"
              >
                Уся стіна <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {doubled.length > 0 && (
          <div
            ref={trackRef}
            onMouseEnter={start}
            onMouseLeave={stop}
            className="flex min-w-0 flex-1 items-baseline gap-x-8 overflow-x-hidden whitespace-nowrap"
          >
            {doubled.map((d, i) => (
              <Link
                key={`${d.pid}-${i}`}
                href={`/defenders/${d.pid}`}
                className="shrink-0 font-display text-xl font-semibold uppercase leading-tight text-ink-lo transition-colors duration-300 hover:text-cream md:text-2xl"
              >
                {d.fullName}
                <span className="ml-2 align-middle text-sm text-ink-faint">
                  {d.deathDate ? new Date(d.deathDate).getFullYear() : ""}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
