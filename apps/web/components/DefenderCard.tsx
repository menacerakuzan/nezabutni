import Link from "next/link";
import type { DefenderSummary } from "../lib/types";
import { formatDates } from "../lib/mock-data";
import { PortraitPlaceholder } from "./PortraitPlaceholder";
import { StatusBadge } from "./StatusBadge";

/** Карточка для сітки («Останні імена» на головній) — референс: memorial.ua, розділ "Останні імена". */
export function DefenderCard({ defender }: { defender: DefenderSummary }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
      <PortraitPlaceholder fullName={defender.fullName} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase text-muted">
            {formatDates(defender.birthDate, defender.deathDate)}
          </p>
          <StatusBadge status={defender.verificationStatus} />
        </div>
        <h3 className="font-display text-lg font-semibold uppercase text-navy">
          {defender.fullName}
        </h3>
        <p className="line-clamp-3 flex-1 text-sm text-navy-2">{defender.excerpt}</p>
        <Link
          href={`/defenders/${defender.pid}`}
          className="mt-2 inline-block rounded-md bg-crimson px-4 py-2 text-center text-sm font-medium text-cream transition-colors hover:bg-crimson-deep"
        >
          Детальніше
        </Link>
      </div>
    </article>
  );
}
