import Link from "next/link";
import { fetchNews } from "../../lib/api";

export const metadata = { title: "Новини — Незабутні" };
export const revalidate = 60;

export default async function NewsPage() {
  const result = await fetchNews();
  const posts = result.ok ? result.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 pb-16 pt-28">
      <nav aria-label="Хлібні крихти" className="mb-4 text-sm text-ink-lo">
        <Link href="/" className="hover:text-cream">
          Головна
        </Link>{" "}
        / <span className="text-cream">Новини</span>
      </nav>
      <p className="text-xs font-semibold uppercase text-crimson-bright">Платформа</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-cream">Новини</h1>
      <p className="mt-4 max-w-prose text-ink">
        Оголошення платформи, події громад і пам’ятні дати.
      </p>

      {!result.ok ? (
        <p className="mt-8 text-sm text-ink-lo">Новини тимчасово недоступні.</p>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-sm text-ink-lo">Новин ще немає.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {posts.map((p) => (
            <li key={p.slug} className="rounded-lg border border-hair bg-white/[0.03] p-5">
              <p className="text-xs uppercase text-crimson-bright">
                {p.category} · {new Date(p.publishedAt).toLocaleDateString("uk-UA")}
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold text-cream">{p.title}</h2>
              {p.excerpt && <p className="mt-2 text-sm text-ink">{p.excerpt}</p>}
              <Link href={`/news/${p.slug}`} className="mt-3 inline-block text-sm text-gold hover:text-gold-soft">
                Читати →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
