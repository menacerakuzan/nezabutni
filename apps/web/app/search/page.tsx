import Link from "next/link";
import { DefenderCardRow } from "../../components/DefenderCardRow";
import { MOCK_DEFENDERS } from "../../lib/mock-data";
import { fetchDefenders } from "../../lib/api";

export const metadata = { title: "Пошук — Незабутні" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await fetchDefenders({ q }) : [];
  const fallback = q && results.length === 0
    ? MOCK_DEFENDERS.filter((d) => d.fullName.toLowerCase().includes(q.toLowerCase()))
    : [];
  const items = results.length > 0 ? results : fallback;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-16 pt-28">
      <nav aria-label="Хлібні крихти" className="mb-4 text-sm text-ink-lo">
        <Link href="/" className="hover:text-cream">
          Головна
        </Link>{" "}
        / <span className="text-cream">Пошук</span>
      </nav>
      <h1 className="font-display text-4xl font-semibold text-cream">Пошук</h1>

      <form action="/search" method="get" className="mt-6 flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Прізвище, ім’я..."
          aria-label="Пошук за іменем"
          autoFocus
          className="flex-1 py-2.5 text-cream placeholder:text-ink-faint"
        />
        <button
          type="submit"
          className="rounded-md bg-crimson px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-crimson-bright"
        >
          Знайти
        </button>
      </form>

      <div className="mt-8">
        {!q && <p className="text-sm text-ink-lo">Введіть ім’я, щоб почати пошук.</p>}
        {q && items.length === 0 && (
          <div className="rounded-lg border border-hair bg-white/[0.03] p-6">
            <p className="text-ink">Профіль не знайдено за запитом «{q}».</p>
            <Link href="/submissions/new" className="mt-3 inline-block text-sm text-gold hover:text-gold-soft">
              Пропонуємо додати →
            </Link>
          </div>
        )}
        {items.map((d) => (
          <DefenderCardRow key={d.pid} defender={d} />
        ))}
      </div>
    </div>
  );
}
