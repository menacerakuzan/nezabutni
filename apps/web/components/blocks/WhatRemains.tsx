import { Expandable } from "../Expandable";
import { MediaFrame } from "./MediaFrame";
import { Reveal } from "../Reveal";

interface Item {
  src: string;
  title: string;
  story: string;
  caption: string;
}

/**
 * «Що залишилось» — музейні вітрини: один предмет, одна історія.
 * Великий експонат + текст, як у залі IWM. Кожен відкривається
 * на весь екран (лайтбокс).
 */
export function WhatRemains({ items }: { items: Item[] }) {
  return (
    <section className="border-y border-hair bg-[#0A0D13]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <span className="caption">Що залишилось</span>
          <p className="mt-4 max-w-prose text-lg text-ink">
            Речі, які пережили своїх власників. Кожна — окрема історія.
          </p>
        </Reveal>

        <div className="mt-12 space-y-16">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={0.05}>
              <figure
                className={`grid items-center gap-8 md:grid-cols-5 md:gap-14 ${
                  i % 2 ? "" : ""
                }`}
              >
                <div className={`md:col-span-3 ${i % 2 ? "md:order-2" : ""}`}>
                  <Expandable src={it.src} alt={it.title} caption={it.caption}>
                    <MediaFrame caption={it.caption} src={it.src} alt={it.title} aspect="aspect-[16/10]" kenBurns />
                  </Expandable>
                </div>
                <figcaption className={`md:col-span-2 ${i % 2 ? "md:order-1 md:text-right" : ""}`}>
                  <h3 className="font-display text-2xl font-semibold text-cream md:text-3xl">
                    {it.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-ink">{it.story}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
