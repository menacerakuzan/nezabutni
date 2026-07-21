import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 30;

interface Block {
  type: string;
  body: string;
}

interface ExhibitDetail {
  slug: string;
  title: string;
  summary: string | null;
  blocks: Block[];
  relatedDefenders: string[];
}

async function fetchExhibit(slug: string): Promise<ExhibitDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  try {
    const res = await fetch(`${apiUrl}/exhibits/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ExhibitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exhibit = await fetchExhibit(slug);
  if (!exhibit) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
      <nav aria-label="Хлібні крихти" className="mb-4 text-sm text-ink-lo">
        <Link href="/" className="hover:text-cream">
          Головна
        </Link>{" "}
        /{" "}
        <Link href="/museum" className="hover:text-cream">
          Онлайн-музей
        </Link>{" "}
        / <span className="text-cream">{exhibit.title}</span>
      </nav>
      <h1 className="font-display text-4xl font-semibold text-cream">{exhibit.title}</h1>
      {exhibit.summary && <p className="mt-4 text-ink">{exhibit.summary}</p>}

      <div className="mt-8 space-y-6">
        {exhibit.blocks.map((block, i) =>
          block.type === "quote" ? (
            <blockquote key={i} className="border-l-4 border-crimson-bright pl-5 font-display text-xl text-cream">
              {block.body}
            </blockquote>
          ) : (
            <p key={i} className="text-ink">
              {block.body}
            </p>
          ),
        )}
      </div>

      {exhibit.relatedDefenders.length > 0 && (
        <div className="mt-10 border-t border-hair pt-6">
          <h2 className="font-display text-lg font-semibold text-cream">Згадуються в експозиції</h2>
          <ul className="mt-2 text-sm text-ink">
            {exhibit.relatedDefenders.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
