import Link from "next/link";
import type { DefenderSummary } from "../lib/types";
import { formatDates } from "../lib/mock-data";
import { PortraitPlaceholder } from "./PortraitPlaceholder";
import { StatusBadge } from "./StatusBadge";

/** Рядкова картка для списку («Захисники») — референс: memorial.ua, сторінка списку. */
export function DefenderCardRow({ defender }: { defender: DefenderSummary }) {
  return (
    <article className="flex gap-5 border-b border-hair py-6 last:border-b-0">
      <PortraitPlaceholder fullName={defender.fullName} className="h-28 w-28 flex-none rounded-md" />
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold uppercase text-cream">
            {defender.fullName}
          </h3>
          <StatusBadge status={defender.verificationStatus} />
        </div>
        <p className="text-sm text-ink-lo">
          {formatDates(defender.birthDate, defender.deathDate)}
          {defender.regionName ? ` · ${defender.regionName}` : ""}
        </p>
        {defender.unitName && <p className="text-sm text-ink">{defender.unitName}</p>}
        <p className="mt-1 line-clamp-2 max-w-prose text-sm text-ink">{defender.excerpt}</p>
      </div>
      <div className="flex flex-none items-end">
        <Link
          href={`/defenders/${defender.pid}`}
          className="rounded-md bg-crimson px-4 py-2 text-sm font-medium text-cream transition-colors duration-fast hover:bg-crimson-bright"
        >
          Детальніше
        </Link>
      </div>
    </article>
  );
}
