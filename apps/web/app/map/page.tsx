import Link from "next/link";
import { MapView } from "../../components/MapView";
import { ContinueExploring } from "../../components/blocks/ContinueExploring";
import { Reveal } from "../../components/Reveal";

export const metadata = { title: "Карта пам’яті — Незабутні" };

export default function MapPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-36">
        <Reveal>
          <span className="caption">Географія пам’яті</span>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.98] text-cream md:text-7xl">
            Карта пам’яті
          </h1>
          <p className="mt-6 max-w-prose text-lg text-ink">
            Місця боїв, меморіали, поховання й пам’ятники регіону. Оберіть «Маршрут пам’яті» —
            і камера проведе вас над місцями, де живе пам’ять. Кожна точка відкриває історію та
            панорамний перегляд.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <Reveal>
          <MapView />
        </Reveal>
        <p className="mt-4 text-sm text-ink-lo">
          Нові місця пам’яті додають редактори громад через{" "}
          <Link href="/admin/places" className="text-gold transition-colors hover:text-gold-soft">
            кабінет редактора
          </Link>
          . Якщо ви знаєте місце, якого немає на карті —{" "}
          <Link href="/contacts" className="text-gold transition-colors hover:text-gold-soft">
            напишіть нам
          </Link>
          .
        </p>
      </section>

      <ContinueExploring
        paths={[
          { href: "/defenders", index: "→", title: "Люди цих місць", note: "Стіна імен" },
          { href: "/museum", index: "→", title: "Онлайн-музей", note: "Експонати й документи" },
          { href: "/stories", index: "→", title: "Тексти пам’яті", note: "Історії, розказані словами" },
        ]}
      />
    </>
  );
}
