import Link from "next/link";
import { MediaFrame } from "../../components/blocks/MediaFrame";
import { ContinueExploring } from "../../components/blocks/ContinueExploring";
import { FullscreenQuote } from "../../components/blocks/FullscreenQuote";
import { Reveal } from "../../components/Reveal";
import { MEDIA } from "../../lib/media";

export const metadata = { title: "Про платформу — Незабутні" };

const PRINCIPLES = [
  {
    n: "01",
    title: "Людина, а не цифра",
    text: "Ми не публікуємо статистику без імен. Кожен запис — це життя: дитинство, професія, шлях, голоси рідних.",
  },
  {
    n: "02",
    title: "Тільки правда",
    text: "Кожен факт верифікують модератори за документами. Жодних згенерованих «спогадів», жодних вигаданих матеріалів.",
  },
  {
    n: "03",
    title: "Пам’ять належить родинам",
    text: "Історію подає і доповнює родина. Вона вирішує, що публічне, а що лишається в закритому архіві.",
  },
  {
    n: "04",
    title: "Назавжди",
    text: "Відкриті стандарти, регулярні резервні копії, щорічний друкований том. Цифрова пам’ять має пережити технології, на яких збудована.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-36">
        <Reveal>
          <span className="caption">Про платформу</span>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.98] text-cream md:text-7xl">
            Меморіал, який будує вся громада
          </h1>
          <p className="mt-8 max-w-prose text-xl leading-relaxed text-ink">
            «Незабутні» — регіональна цифрова платформа пам’яті захисників: єдиний реєстр,
            онлайн-музей, карта місць і мережа зв’язків. Ми будуємо її так, щоб через десятиліття
            нащадки могли не прочитати про своїх — а зустрітися з ними.
          </p>
        </Reveal>
      </section>

      {/* Принципи */}
      <section className="border-y border-hair bg-[#0A0D13]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <span className="caption">Чотири принципи</span>
          </Reveal>
          <div className="mt-10 grid gap-x-14 gap-y-12 md:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.06}>
                <div className="flex gap-6">
                  <span className="font-display text-sm text-gold">{p.n}</span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-cream">{p.title}</h2>
                    <p className="mt-3 leading-relaxed text-ink">{p.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Як це працює */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <MediaFrame
              caption="Родинні архіви — основа меморіалу"
              src={MEDIA.archiveTable}
              alt="Старі листи й фотографії"
              aspect="aspect-[4/3]"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <span className="caption">Як з’являється історія</span>
              <ol className="mt-8 space-y-6">
                {[
                  ["Родина подає ім’я", "Через форму подання — з документами, світлинами, спогадами."],
                  ["Модератори верифікують", "Звіряють факти зі службовими документами та відкритими джерелами."],
                  ["Історія стає вогником", "Ім’я з’являється у полі вогнів, на стіні пам’яті й на карті."],
                  ["Пам’ять росте", "Побратими й близькі доповнюють сторінку спогадами та матеріалами."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-5">
                    <span className="font-display text-lg text-gold">{i + 1}</span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-cream">{t}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/submissions/new"
                className="mt-8 inline-flex rounded-[3px] bg-cream px-6 py-3 text-sm font-medium text-void transition-colors hover:bg-white"
              >
                Подати ім’я
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <FullscreenQuote
        quote="Пам’ять — це не минуле. Це обіцянка, яку живі дають щодня."
        author="Команда «Незабутні»"
        role="маніфест платформи"
      />

      <ContinueExploring
        paths={[
          { href: "/partners", index: "→", title: "Партнери", note: "Громади, музеї, архіви" },
          { href: "/accessibility", index: "→", title: "Доступність", note: "Як ми робимо пам’ять доступною всім" },
          { href: "/contacts", index: "→", title: "Контакти", note: "Зв’язатися з командою" },
        ]}
      />
    </>
  );
}
