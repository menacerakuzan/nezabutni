import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchNewsBySlug } from "../../../lib/api";

export const revalidate = 60;

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await fetchNewsBySlug(decodeURIComponent(slug));
  if (!result.ok) notFound();
  const post = result.data;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
      <nav aria-label="Хлібні крихти" className="mb-4 text-sm text-ink-lo">
        <Link href="/" className="hover:text-cream">
          Головна
        </Link>{" "}
        /{" "}
        <Link href="/news" className="hover:text-cream">
          Новини
        </Link>{" "}
        / <span className="text-cream">{post.title}</span>
      </nav>
      <p className="text-xs uppercase text-crimson-bright">
        {post.category} · {new Date(post.publishedAt).toLocaleDateString("uk-UA")}
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-cream">{post.title}</h1>
      {post.excerpt && <p className="mt-4 text-ink">{post.excerpt}</p>}

      <div className="mt-8 whitespace-pre-line text-ink">{post.body}</div>

      {post.author && <p className="mt-10 border-t border-hair pt-4 text-xs text-ink-lo">Автор: {post.author.displayName}</p>}
    </div>
  );
}
