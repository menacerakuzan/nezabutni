import Link from "next/link";
import { MediaFrame } from "../../components/blocks/MediaFrame";
import { Reveal } from "../../components/Reveal";
import { MEDIA } from "../../lib/media";
import { mediaUrl } from "../../lib/api";

export const metadata = { title: "Онлайн-музей — Незабутні" };
export const revalidate = 30;

interface ExhibitSummary {
  slug: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
}
interface StorySummary {
  slug: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
}

async function fetchJson<T>(path: string): Promise<T[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  try {
    const res = await fetch(`${apiUrl}${path}`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function MuseumPage() {
  const [exhibits, stories] = await Promise.all([
    fetchJson<ExhibitSummary>("/exhibits"),
    fetchJson<StorySummary>("/stories"),
  ]);

  return (
    <>
      {/* Вхід до музею — велика зала */}
      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MEDIA.chapelCandles}
          alt="Ряди свічок у темряві"
          className="kenburns absolute inset-0 h-full w-full object-cover [filter:saturate(0.55)_contrast(1.05)_brightness(0.7)]"
        />
        <div className="pointer-events-none absolute inset-0 scrim-bottom" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-40">
          <Reveal>
            <span className="caption">Цифрова експозиція</span>
            <h1 className="mt-5 font-display text-6xl font-semibold leading-[0.95] text-cream md:text-8xl">
              Онлайн-музей
            </h1>
            <p className="mt-6 max-w-prose text-lg text-ink">
              Особисті речі, документи, світлини й голоси — зібрані в тематичні зали. Кожна
              експозиція — окрема історія, яку можна пройти.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Зали (експозиції) — великі обкладинки */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <span className="caption">Зали музею</span>
        </Reveal>
        {exhibits.length === 0 ? (
          <p className="mt-6 text-ink-lo">Експозиції готуються до відкриття.</p>
        ) : (
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {exhibits.map((e, i) => (
              <Reveal key={e.slug} delay={(i % 2) * 0.08}>
                <Link href={`/museum/${e.slug}`} className="group relative block overflow-hidden">
                  {e.coverUrl ? (
                    <MediaFrame
                      caption={`Зала ${String(i + 1).padStart(2, "0")}`}
                      src={mediaUrl(e.coverUrl)!}
                      alt=""
                      aspect="aspect-[16/10]"
                      kenBurns
                    />
                  ) : (
                    <div className="aspect-[16/10] w-full border border-hair bg-white/[0.02]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-8 pb-14">
                    <h2 className="font-display text-3xl font-semibold text-cream md:text-4xl">
                      {e.title}
                    </h2>
                    {e.summary && <p className="mt-2 max-w-md text-sm text-ink">{e.summary}</p>}
                    <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold transition-all group-hover:gap-3">
                      Увійти до зали →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Тексти пам’яті — журнальний список із мініатюрами */}
      <section className="border-t border-hair bg-navy-950/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <span className="caption">Тексти пам’яті</span>
          </Reveal>
          {stories.length === 0 ? (
            <p className="mt-6 text-ink-lo">Історії готуються до публікації.</p>
          ) : (
            <div className="mt-8 divide-y divide-hair border-y border-hair">
              {stories.map((s, i) => (
                <Reveal key={s.slug} delay={i * 0.05}>
                  <Link
                    href={`/stories/${s.slug}`}
                    className="group flex items-center gap-6 py-6 transition-colors hover:bg-white/[0.02] md:gap-10"
                  >
                    {s.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(s.coverUrl)!}
                        alt=""
                        loading="lazy"
                        className="h-24 w-36 flex-none rounded-[3px] object-cover [filter:saturate(0.45)_brightness(0.8)] transition-all duration-500 group-hover:[filter:saturate(0.8)_brightness(1)]"
                      />
                    ) : (
                      <div className="h-24 w-36 flex-none rounded-[3px] border border-hair bg-white/[0.02]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-semibold text-cream transition-colors group-hover:text-gold md:text-2xl">
                        {s.title}
                      </h3>
                      {s.summary && <p className="mt-1 line-clamp-2 text-sm text-ink">{s.summary}</p>}
                    </div>
                    <span className="hidden text-xl text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-cream md:block">
                      →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
