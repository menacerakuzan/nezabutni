import { Reveal } from "../Reveal";

/**
 * «Непрожиті роки» — життя не обривається датою: таймлайн продовжується
 * пунктиром у майбутнє. Без пафосу й вигаданих деталей — лише час,
 * який людина мала прожити.
 */
export function UnlivedYears({
  fullName,
  birthDate,
  deathDate,
}: {
  fullName: string;
  birthDate: string | null;
  deathDate: string | null;
}) {
  if (!birthDate || !deathDate) return null;
  const birth = new Date(birthDate).getFullYear();
  const death = new Date(deathDate).getFullYear();
  const ageAtDeath = death - birth;
  const firstName = fullName.split(" ")[1] ?? fullName;

  const milestones = [1, 5, 10, 25]
    .map((plus) => ({ year: death + plus, age: ageAtDeath + plus }))
    .filter((m) => m.age <= 100);

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="rule" />
      <Reveal>
        <div className="pt-10">
          <span className="caption">Непрожиті роки</span>
          <p className="mt-6 text-lg leading-relaxed text-ink">
            {firstName} прожив {ageAtDeath} {ageAtDeath % 10 === 1 && ageAtDeath !== 11 ? "рік" : ageAtDeath % 10 >= 2 && ageAtDeath % 10 <= 4 && (ageAtDeath < 10 || ageAtDeath > 20) ? "роки" : "років"}.
            Далі — час, який у нього забрали.
          </p>

          <ol className="mt-10 space-y-0">
            {/* прожите — суцільна лінія */}
            <li className="flex gap-6 border-l-2 border-cream/60 pb-8 pl-6">
              <div>
                <span className="font-display text-2xl font-semibold text-cream">{birth} — {death}</span>
                <p className="mt-1 text-sm text-ink">Прожите життя</p>
              </div>
            </li>
            {/* непрожите — пунктир */}
            {milestones.map((m, i) => (
              <li
                key={m.year}
                className="flex gap-6 border-l-2 border-dashed border-cream/20 pb-8 pl-6 last:pb-0"
                style={{ opacity: 1 - i * 0.16 }}
              >
                <div>
                  <span className="font-display text-2xl font-semibold text-cream/50">{m.year}</span>
                  <p className="mt-1 text-sm text-ink-lo">Йому виповнилося б {m.age}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-10 max-w-prose text-ink">
            Ці дати ніколи не настануть. Саме в цьому — справжня ціна: не абстрактна війна,
            а роки з іменем {firstName}, яких просто не буде.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
