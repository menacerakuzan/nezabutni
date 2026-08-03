import Link from "next/link";
import { notFound } from "next/navigation";
import { CandleButton } from "../../../components/CandleButton";
import { MemorySection } from "../../../components/MemorySection";
import { MediaFrame } from "../../../components/blocks/MediaFrame";
import { UnlivedYears } from "../../../components/blocks/UnlivedYears";
import { ContinueExploring } from "../../../components/blocks/ContinueExploring";
import { Reveal } from "../../../components/Reveal";
import { DataUnavailable } from "../../../components/DataUnavailable";
import { formatDates } from "../../../lib/mock-data";
import { fetchDefenderByPid, mediaUrl } from "../../../lib/api";

export const revalidate = 30;

export default async function DefenderProfilePage({
  params,
}: {
  params: Promise<{ pid: string }>;
}) {
  const { pid } = await params;

  const result = await fetchDefenderByPid(pid);
  // 404 — сторінки немає; недоступність бази не маскуємо демо-даними
  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    return (
      <div className="mx-auto max-w-6xl px-6 pt-36">
        <DataUnavailable
          title="Сторінку пам’яті не вдалося завантажити"
          hint="Дані цієї людини зберігаються в реєстрі — зараз він тимчасово недоступний. Спробуйте оновити сторінку."
        />
      </div>
    );
  }
  const defender = result.data;

  return (
    <>
      {/* Зала пам’яті */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <div className="grid gap-10 md:grid-cols-[minmax(0,460px)_1fr] md:gap-20">
          <Reveal>
            {defender.portraitUrl ? (
              <MediaFrame
                caption="Портрет"
                src={mediaUrl(defender.portraitUrl)!}
                alt={`Портрет: ${defender.fullName}`}
                aspect="aspect-[4/5]"
                kenBurns
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[4px] border border-hair bg-white/[0.02]">
                <p className="px-6 text-center text-sm text-ink-faint">
                  Портрет ще не додано.
                  <br />
                  Родина може додати його через форму подання.
                </p>
              </div>
            )}
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex h-full flex-col justify-end md:pl-4">
              <span className="caption">Захисник України</span>
              <h1 className="mt-4 font-display text-5xl font-semibold uppercase leading-[0.98] text-cream md:text-7xl">
                {defender.fullName}
              </h1>
              {defender.callsign && <p className="mt-4 text-2xl text-gold">«{defender.callsign}»</p>}
              <div className="mt-6 space-y-1 text-lg text-ink">
                <p>{formatDates(defender.birthDate, defender.deathDate)}</p>
                {defender.unitName && <p>{defender.unitName}</p>}
                {defender.regionName && <p className="text-ink-lo">{defender.regionName}</p>}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <CandleButton pid={defender.pid} initialCount={defender.candleCount} />
                <button className="rounded-[3px] border border-hair-strong px-5 py-2.5 text-sm text-ink transition-colors hover:border-cream hover:text-cream">
                  Поділитися
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Життєпис */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rule" />
        <div className="pt-10">
          <span className="caption">Життєпис</span>
          {defender.bio ? (
            <p className="mt-6 whitespace-pre-line font-display text-2xl leading-relaxed text-cream md:text-3xl [text-wrap:balance]">
              {defender.bio}
            </p>
          ) : (
            <p className="mt-6 text-ink-lo">
              Життєпис ще не додано.{" "}
              <Link href="/submissions/new" className="text-gold transition-colors hover:text-gold-soft">
                Родина може розповісти цю історію
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* Непрожиті роки */}
      <UnlivedYears
        fullName={defender.fullName}
        birthDate={defender.birthDate}
        deathDate={defender.deathDate}
      />

      {/* Спогади рідних */}
      <div className="mx-auto max-w-3xl px-6 pb-12">
        <MemorySection pid={defender.pid} />
      </div>

      {/* Маршрут далі */}
      <ContinueExploring
        paths={[
          {
            href: `/?focus=${encodeURIComponent(defender.pid)}`,
            index: "→",
            title: "Його вогник на Полі",
            note: "Знайти серед усіх імен",
          },
          { href: "/museum", index: "→", title: "Онлайн-музей", note: "Експонати й документи" },
          { href: "/defenders", index: "→", title: "Наступна історія", note: "Повернутися до стіни імен" },
        ]}
      />
    </>
  );
}
