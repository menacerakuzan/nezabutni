import Link from "next/link";
import { notFound } from "next/navigation";
import { CandleButton } from "../../../components/CandleButton";
import { MemorySection } from "../../../components/MemorySection";
import { MediaFrame } from "../../../components/blocks/MediaFrame";
import { UnlivedYears } from "../../../components/blocks/UnlivedYears";
import { WhatRemains } from "../../../components/blocks/WhatRemains";
import { ContinueExploring } from "../../../components/blocks/ContinueExploring";
import { Expandable } from "../../../components/Expandable";
import { Reveal } from "../../../components/Reveal";
import { getDefenderByPid, formatDates } from "../../../lib/mock-data";
import { portraitFor, MEDIA } from "../../../lib/media";
import { fetchDefenderByPid } from "../../../lib/api";

export const revalidate = 30;

export default async function DefenderProfilePage({
  params,
}: {
  params: Promise<{ pid: string }>;
}) {
  const { pid } = await params;

  const fromApi = await fetchDefenderByPid(pid);
  const mock = getDefenderByPid(pid);
  const defender = fromApi ?? (mock ? { ...mock, bio: mock.excerpt, candleCount: 0 } : null);
  if (!defender) notFound();

  const portrait = portraitFor(defender.pid);

  return (
    <>
      {/* Зала пам’яті */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-28">
        <div className="grid gap-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-16">
          <Reveal>
            <Expandable src={portrait} alt={`Портрет: ${defender.fullName}`} caption="Портрет · родинний архів (демо)">
              <MediaFrame
                caption="Портрет · родинний архів (демо)"
                src={portrait}
                alt={`Демонстраційний портрет: ${defender.fullName}`}
                aspect="aspect-[4/5]"
                kenBurns
              />
            </Expandable>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex h-full flex-col justify-end">
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
          <p className="mt-6 font-display text-2xl leading-relaxed text-cream md:text-3xl [text-wrap:balance]">
            {defender.bio}
          </p>
        </div>
      </section>

      {/* Непрожиті роки */}
      <UnlivedYears
        fullName={defender.fullName}
        birthDate={defender.birthDate}
        deathDate={defender.deathDate}
      />

      {/* Що залишилось — вітрини */}
      <WhatRemains
        items={[
          {
            src: MEDIA.lettersString,
            title: "Листи, які встиг надіслати",
            story:
              "Пачка листів додому, перев’язана мотузкою. Останній датований за тиждень до загибелі. Родина передала копії меморіалу, оригінали зберігає мати. (Демонстраційна вітрина)",
            caption: "Вітрина 01 · Листи",
          },
          {
            src: MEDIA.letterPhoto,
            title: "Світлина у нагрудній кишені",
            story:
              "Чорно-біле фото, яке він носив із собою всю службу. На звороті — дитячий почерк: «Тату, повертайся». (Демонстраційна вітрина)",
            caption: "Вітрина 02 · Світлина",
          },
        ]}
      />

      {/* Архівні матеріали */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <span className="caption">Архів сторінки</span>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { src: MEDIA.archiveTable, cap: "Родинний архів (демо)" },
            { src: MEDIA.bwCeremony, cap: "Церемонія вшанування (демо)" },
            { src: MEDIA.winterGrave, cap: "Місце пам’яті (демо)" },
          ].map((m, i) => (
            <Reveal key={m.cap} delay={i * 0.06}>
              <Expandable src={m.src} caption={m.cap}>
                <MediaFrame caption={m.cap} src={m.src} alt="" aspect="aspect-square" />
              </Expandable>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-lo">
          Родина може додати світлини, листи й документи через{" "}
          <Link href="/submissions/new" className="text-gold transition-colors hover:text-gold-soft">
            форму подання
          </Link>
          .
        </p>
      </section>

      {/* Спогади рідних */}
      <div className="mx-auto max-w-3xl px-6 pb-12">
        <MemorySection pid={defender.pid} />
      </div>

      {/* Маршрут далі */}
      <ContinueExploring
        paths={[
          { href: "/map", index: "→", title: "Місця його шляху", note: "Карта пам’яті регіону" },
          { href: "/museum", index: "→", title: "Онлайн-музей", note: "Експонати й документи" },
          { href: "/defenders", index: "→", title: "Наступна історія", note: "Повернутися до стіни імен" },
        ]}
      />
    </>
  );
}
