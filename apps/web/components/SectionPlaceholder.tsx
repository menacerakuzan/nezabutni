import Link from "next/link";

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
  roadmapNote,
}: {
  eyebrow: string;
  title: string;
  description: string;
  roadmapNote: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(45% 60% at 70% 0%, rgba(223,155,59,0.1), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-32">
        <nav aria-label="Хлібні крихти" className="mb-8 text-sm text-ink-lo">
          <Link href="/" className="transition-colors hover:text-cream">
            Головна
          </Link>{" "}
          <span className="text-ink-faint">/</span> <span className="text-ink">{title}</span>
        </nav>
        <p className="text-[11px] uppercase text-gold-soft">{eyebrow}</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-cream">{title}</h1>
        <p className="mt-6 max-w-prose text-lg text-ink">{description}</p>
        <div className="mt-10 rounded-2xl border border-hair bg-white/[0.03] p-6">
          <p className="text-sm text-ink-lo">{roadmapNote}</p>
        </div>
      </div>
    </section>
  );
}
