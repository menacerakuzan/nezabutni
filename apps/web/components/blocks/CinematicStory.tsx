import Link from "next/link";
import { Reveal } from "../Reveal";
import { MediaFrame } from "./MediaFrame";
import { formatDates } from "../../lib/mock-data";
import { mediaUrl } from "../../lib/api";
import type { DefenderSummary } from "../../lib/types";

/**
 * Кінематографічний розворот однієї історії: велика вітрина ліворуч,
 * розлога типографіка праворуч. Асиметрія, повітря, музейний підпис.
 */
export function CinematicStory({
  defender,
  flip = false,
}: {
  defender: DefenderSummary;
  flip?: boolean;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div
        className={`grid items-center gap-10 md:gap-16 lg:grid-cols-2 ${
          flip ? "" : ""
        }`}
      >
        <Reveal className={flip ? "lg:order-2" : ""}>
          <Link href={`/defenders/${defender.pid}`} className="group block">
            {defender.portraitUrl ? (
              <MediaFrame
                caption="Портрет"
                src={mediaUrl(defender.portraitUrl)!}
                alt={`Портрет: ${defender.fullName}`}
                aspect="aspect-[5/6]"
                kenBurns
              />
            ) : (
              <div className="flex aspect-[5/6] items-center justify-center rounded-[4px] border border-hair bg-white/[0.02]">
                <p className="px-6 text-center text-sm text-ink-faint">Портрет ще не додано</p>
              </div>
            )}
          </Link>
        </Reveal>

        <Reveal delay={0.1} className={flip ? "lg:order-1" : ""}>
          <div>
            <span className="caption">Історія людини</span>
            <h3 className="mt-4 font-display text-4xl font-semibold uppercase leading-[1.05] text-cream md:text-5xl">
              {defender.fullName}
            </h3>
            {defender.callsign && (
              <p className="mt-3 text-xl text-gold">«{defender.callsign}»</p>
            )}
            <p className="mt-4 text-ink-lo">
              {formatDates(defender.birthDate, defender.deathDate)}
              {defender.unitName ? ` · ${defender.unitName}` : ""}
            </p>
            <p className="mt-7 max-w-prose text-xl leading-relaxed text-ink">{defender.excerpt}</p>
            <Link
              href={`/defenders/${defender.pid}`}
              className="mt-8 inline-flex items-center gap-2.5 text-sm text-cream transition-colors hover:text-gold"
            >
              Читати повну історію <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
