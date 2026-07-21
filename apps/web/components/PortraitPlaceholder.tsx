function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Монограма-табличка замість фото. Свідоме рішення: реальні світлини
 * з’являються лише коли родина/партнер їх додає — платформа не вигадує
 * зображень загиблих. Гравіроване ім’я на темному камені пам’яті.
 */
export function PortraitPlaceholder({
  fullName,
  className = "",
}: {
  fullName: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-panel-2 to-navy-950 ${className}`}
      role="img"
      aria-label={`Портрет: ${fullName}`}
    >
      {/* тепле сяйво свічки зсередини */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 42%, rgba(223,155,59,0.16), transparent 72%)",
        }}
      />
      <span className="relative font-display text-3xl font-semibold tracking-wide text-cream/85">
        {initials(fullName)}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </div>
  );
}
