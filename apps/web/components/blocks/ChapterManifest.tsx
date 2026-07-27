import { ChapterIntro } from "./ChapterIntro";
import { MediaFrame } from "./MediaFrame";
import { Reveal } from "../Reveal";
import { ButtonLink } from "../ui/Button";
import { MEDIA } from "../../lib/media";

export interface ChapterManifestProps {
  index?: string;
  kicker?: string;
  title?: string;
  lead1?: string;
  lead2?: string;
  aboutHref?: string;
  aboutLabel?: string;
}

const D: Required<ChapterManifestProps> = {
  index: "I",
  kicker: "Про що цей проєкт",
  title: "Ми зберігаємо не статистику. Ми зберігаємо людей.",
  lead1: "За кожним ім’ям — дитинство, професія, кохання, друзі, мрії. Людина, яка мала прожити довге життя, а натомість стала на його захист.",
  lead2: "Наше завдання — щоб через десятиліття нащадки могли подивитися їм в очі, почути їхні голоси й прочитати їхні історії. Не в підручнику, а тут, наживо.",
  aboutHref: "/about",
  aboutLabel: "Про меморіал",
};

/** Зал I: маніфест платформи. Текст редагується в /admin/pages (page_block.props). */
export function ChapterManifest(props: ChapterManifestProps) {
  const p = { ...D, ...props };
  return (
    <>
      <ChapterIntro index={p.index} kicker={p.kicker} title={p.title} />
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
              <p>{p.lead1}</p>
              <p className="text-cream">{p.lead2}</p>
              <ButtonLink href={p.aboutHref} variant="text">
                {p.aboutLabel}
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
