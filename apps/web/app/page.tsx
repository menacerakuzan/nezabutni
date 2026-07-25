import Link from "next/link";
import { FieldOfLights } from "../components/field/FieldOfLights";
import { ChapterIntro } from "../components/blocks/ChapterIntro";
import { formatDates } from "../lib/mock-data";
import { FullscreenQuote } from "../components/blocks/FullscreenQuote";
import { CinematicStory } from "../components/blocks/CinematicStory";
import { MemorialWall } from "../components/blocks/MemorialWall";
import { MediaFrame } from "../components/blocks/MediaFrame";
import { ContinueExploring } from "../components/blocks/ContinueExploring";
import { PhotoScene } from "../components/blocks/PhotoScene";
import { StoryCarousel } from "../components/StoryCarousel";
import { MEDIA } from "../lib/media";
import { Reveal } from "../components/Reveal";
import { ButtonLink } from "../components/ui/Button";
import { fetchDefenders, fetchStats } from "../lib/api";
import { DataUnavailable } from "../components/DataUnavailable";
import type { DefenderSummary } from "../lib/types";

export const revalidate = 30;

export default async function HomePage() {
  const [defendersResult, statsResult] = await Promise.all([fetchDefenders(), fetchStats()]);
  const latest = defendersResult.ok ? defendersResult.data : [];
  const stats = statsResult.ok ? statsResult.data : null;
  const featured: DefenderSummary | undefined = latest[0];
  const second: DefenderSummary | undefined = latest[1];

  // Реєстр недоступний — кажемо про це прямо, а не показуємо демо-імена
  if (!defendersResult.ok) {
    return (
      <div className="mx-auto max-w-6xl px-6 pt-40">
        <DataUnavailable />
      </div>
    );
  }

  return (
    <>
      {/* ЗАЛ 0 · Поле вогнів — вхід, реєстр і навігація одночасно */}
      <FieldOfLights
        real={latest.map((d) => ({
          pid: d.pid,
          name: d.fullName,
          years: formatDates(d.birthDate, d.deathDate),
          region: d.regionName,
        }))}
      />

      {/* ЗАЛ I · Маніфест */}
      <ChapterIntro
        index="I"
        kicker="Про що цей проєкт"
        title="Ми зберігаємо не статистику. Ми зберігаємо людей."
      />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Reveal>
            <MediaFrame
              caption="Родинний архів · листи й світлини"
              src={MEDIA.archiveTable}
              alt="Старі листи й фотографії на столі"
              aspect="aspect-[5/6]"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-6 text-xl leading-relaxed text-ink">
              <p>
                За кожним іменем — дитинство, професія, кохання, друзі, мрії. Людина, яка мала
                прожити довге життя, а натомість стала на його захист.
              </p>
              <p className="text-cream">
                Наше завдання — щоб через десятиліття нащадки могли подивитися їм в очі, почути
                їхні голоси й прочитати їхні історії. Не в підручнику, а тут, наживо.
              </p>
              <ButtonLink href="/about" variant="text">
                Про меморіал
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ФОТО-СЦЕНА · Лампадки */}
      <PhotoScene
        src={MEDIA.cemeteryLanterns}
        alt="Лампадки пам’яті у вечірній темряві"
        kicker="Вечір пам’яті"
        title="Світло не гасне, поки його передають далі."
        credit="Демонстраційний кадр · Pexels · у продакшні — власна зйомка меморіалів регіону"
      />

      {/* ЗАЛ ТИШІ · Цитата на весь екран */}
      <FullscreenQuote
        quote="Коли мене запитують, що таке війна, я без роздуму відповім: імена."
        author="Максим Кривцов"
        role="поет і воїн"
      />

      {/* ЗАЛ II · Остання історія */}
      <ChapterIntro
        index="II"
        kicker="Історії пам’яті"
        title="Історії, які зберігають родини"
        lead="Кожну сторінку тут створюють рідні й побратими. Це їхні слова та їхня пам’ять."
      />
      {featured && <CinematicStory defender={featured} />}
      {second && <CinematicStory defender={second} flip />}

      {/* ЗАЛ III · Стіна пам’яті */}
      <MemorialWall defenders={latest} total={stats?.total ?? latest.length} />

      {/* ЗАЛ IV · Простір пам’яті (карта + музей) */}
      <ChapterIntro
        index="IV"
        kicker="Простір пам’яті"
        title="Пам’ять має географію й обличчя"
      />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-3 md:grid-cols-2">
          <Reveal>
            <Link href="/map" className="group relative block overflow-hidden">
              <MediaFrame
                caption="Одеса · прапори на фасаді"
                src={MEDIA.odesaFlags}
                alt="Фасад будинку в Одесі з українськими прапорами"
                aspect="aspect-[4/3]"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-8">
                <h3 className="font-display text-3xl font-semibold text-cream md:text-4xl">
                  Карта пам’яті
                </h3>
                <p className="mt-2 max-w-xs text-sm text-ink">
                  Місця боїв, меморіали й маршрути на інтерактивній карті регіону.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold transition-all group-hover:gap-3">
                  Відкрити карту →
                </span>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <Link href="/museum" className="group relative block overflow-hidden">
              <MediaFrame
                caption="Експонат · рамка зі світлиною"
                src={MEDIA.framedPhoto}
                alt="Фотографія в рамці поруч зі свічками"
                aspect="aspect-[4/3]"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-8">
                <h3 className="font-display text-3xl font-semibold text-cream md:text-4xl">
                  Онлайн-музей
                </h3>
                <p className="mt-2 max-w-xs text-sm text-ink">
                  Експозиції, документи й особисті речі — цифрова виставка пам’яті.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold transition-all group-hover:gap-3">
                  Увійти до музею →
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ЗАЛ V · Тексти пам’яті */}
      <ChapterIntro index="V" kicker="Тексти пам’яті" title="Історії, розказані словами" />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <StoryCarousel />
        </Reveal>
      </section>

      {/* Маршрут далі */}
      <ContinueExploring
        paths={[
          { href: "/defenders", index: "→", title: "Реєстр імен", note: "Уся стіна пам’яті" },
          { href: "/museum", index: "→", title: "Онлайн-музей", note: "Експозиції та документи" },
          { href: "/submissions/new", index: "→", title: "Подати ім’я", note: "Додати історію захисника" },
        ]}
      />

      {/* Заклик — бордовий зал */}
      <section className="relative overflow-hidden border-t border-hair bg-bordeaux">
        <div className="pointer-events-none absolute inset-0 candle-veil opacity-70" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold leading-tight text-cream md:text-6xl [text-wrap:balance]">
              Знаєте захисника, чиє ім’я має світити тут?
            </h2>
            <p className="mx-auto mt-6 max-w-prose text-lg text-ink">
              Розкажіть його історію. Після верифікації вона стане частиною меморіалу — назавжди.
            </p>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/submissions/new" variant="solid">
                Подати ім’я
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
