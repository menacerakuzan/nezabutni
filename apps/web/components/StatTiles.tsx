interface Stats {
  total: number;
  verified: number;
  pending: number;
  places: number;
  units: number;
}

const TILES: { key: keyof Stats; label: string }[] = [
  { key: "total", label: "Профілів у реєстрі" },
  { key: "verified", label: "Підтверджено" },
  { key: "pending", label: "На перевірці" },
  { key: "places", label: "Точок на карті" },
  { key: "units", label: "Підрозділів" },
];

async function fetchStats(): Promise<Stats | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  try {
    const res = await fetch(`${apiUrl}/stats`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function StatTiles() {
  const stats = await fetchStats();
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-tile border border-cream/15 bg-cream/15 sm:grid-cols-5">
      {TILES.map((t) => (
        <div
          key={t.key}
          className="flex flex-col justify-end bg-navy px-5 py-8 transition-colors hover:bg-navy-2"
        >
          <span className="font-display text-3xl font-semibold text-gold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {stats[t.key]}
          </span>
          <span className="mt-1 text-xs text-cream/70">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
