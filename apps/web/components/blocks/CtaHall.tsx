import { Reveal } from "../Reveal";
import { ButtonLink } from "../ui/Button";

export interface CtaHallProps {
  title?: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

const D: Required<CtaHallProps> = {
  title: "Знаєте захисника, чиє ім’я має світити тут?",
  body: "Розкажіть його історію. Після верифікації вона стане частиною меморіалу — назавжди.",
  buttonLabel: "Подати ім’я",
  buttonHref: "/submissions/new",
};

/** Фінальний заклик — бордовий зал. Текст редагується в /admin/pages. */
export function CtaHall(props: CtaHallProps) {
  const p = { ...D, ...props };
  return (
    <section className="relative overflow-hidden border-t border-hair bg-bordeaux">
      <div className="pointer-events-none absolute inset-0 candle-veil opacity-70" />
      <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-semibold leading-tight text-cream md:text-6xl [text-wrap:balance]">
            {p.title}
          </h2>
          <p className="mx-auto mt-6 max-w-prose text-lg text-ink">{p.body}</p>
          <div className="mt-10 flex justify-center">
            <ButtonLink href={p.buttonHref} variant="solid">
              {p.buttonLabel}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
