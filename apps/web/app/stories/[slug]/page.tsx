import Link from "next/link";
import { notFound } from "next/navigation";
import { mediaUrl } from "../../../lib/api";

export const revalidate = 30;

interface Block {
  type: string;
  body: string;
}
interface TimelineItem {
  date: string;
  title: string;
  body: string;
}
interface StoryDetail {
  slug: string;
  title: string;
  summary: string | null;
  blocks: Block[];
  timeline: TimelineItem[] | null;
  coverUrl: string | null;
}

async function fetchStory(slug: string): Promise<StoryDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  try {
    const res = await fetch(`${apiUrl}/stories/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await fetchStory(slug);
  if (!story) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
      <nav aria-label="Хлібні крихти" className="mb-4 text-sm text-ink-lo">
        <Link href="/" className="hover:text-cream">
          Головна
        </Link>{" "}
        /{" "}
        <Link href="/stories" className="hover:text-cream">
          Тексти пам’яті
        </Link>{" "}
        / <span className="text-cream">{story.title}</span>
      </nav>
      {story.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(story.coverUrl)!} alt="" className="mb-6 aspect-[16/9] w-full rounded-[4px] object-cover" />
      )}
      <h1 className="font-display text-4xl font-semibold text-cream">{story.title}</h1>
      {story.summary && <p className="mt-4 text-ink">{story.summary}</p>}

      <div className="mt-8 space-y-4">
        {story.blocks.map((b, i) => (
          <p key={i} className="text-ink">
            {b.body}
          </p>
        ))}
      </div>

      {story.timeline && story.timeline.length > 0 && (
        <div className="mt-10 border-t border-hair pt-8">
          <h2 className="font-display text-lg font-semibold text-cream">Хронологія</h2>
          <ol className="mt-4 space-y-4 border-l border-hair pl-5">
            {story.timeline.map((t, i) => (
              <li key={i}>
                <p className="text-xs uppercase text-crimson-bright">
                  {new Date(t.date).toLocaleDateString("uk-UA")}
                </p>
                <p className="mt-1 font-medium text-cream">{t.title}</p>
                <p className="text-sm text-ink">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
