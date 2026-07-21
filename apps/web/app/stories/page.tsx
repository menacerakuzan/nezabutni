import Link from "next/link";

export const metadata = { title: "Тексти пам’яті — Незабутні" };
export const revalidate = 30;

interface StorySummary {
  slug: string;
  title: string;
  summary: string | null;
}

async function fetchStories(): Promise<StorySummary[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  try {
    const res = await fetch(`${apiUrl}/stories`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function StoriesPage() {
  const stories = await fetchStories();

  return (
    <div className="mx-auto max-w-4xl px-6 pb-16 pt-28">
      <nav aria-label="Хлібні крихти" className="mb-4 text-sm text-ink-lo">
        <Link href="/" className="hover:text-cream">
          Головна
        </Link>{" "}
        / <span className="text-cream">Тексти пам’яті</span>
      </nav>
      <p className="text-xs font-semibold uppercase text-crimson-bright">Редакційний контент</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-cream">Тексти пам’яті</h1>
      <p className="mt-4 max-w-prose text-ink">
        Кураторські лонгриди й «історії пам’яті» з власним таймлайном, пов’язані з профілями
        конкретних захисників.
      </p>

      {stories.length === 0 ? (
        <p className="mt-8 text-sm text-ink-lo">Немає опублікованих текстів.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {stories.map((s) => (
            <li key={s.slug} className="rounded-lg border border-hair bg-white/[0.03] p-5">
              <h2 className="font-display text-lg font-semibold text-cream">{s.title}</h2>
              {s.summary && <p className="mt-2 text-sm text-ink">{s.summary}</p>}
              <Link href={`/stories/${s.slug}`} className="mt-3 inline-block text-sm text-gold hover:text-gold-soft">
                Читати →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
