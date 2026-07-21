import { Reveal } from "../Reveal";

/**
 * Розділова карта-глава, як титр документального фільму:
 * номер залу, велика назва, тонка лінія. Створює ритм і паузу між главами.
 */
export function ChapterIntro({
  index,
  kicker,
  title,
  lead,
}: {
  index: string;
  kicker: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="rule" />
      <Reveal>
        <div className="grid gap-8 py-10 md:grid-cols-[auto_1fr] md:items-baseline md:gap-16">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-sm text-gold">{index}</span>
            <span className="caption">{kicker}</span>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight text-cream md:text-5xl">
              {title}
            </h2>
            {lead && <p className="mt-5 max-w-prose text-lg text-ink">{lead}</p>}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
