/* eslint-disable @next/next/no-img-element */

/**
 * Музейна вітрина. З `src` — справжнє зображення у стриманій «архівній»
 * обробці (знебарвлення, віньєтка, музейний підпис). Без `src` — чесний
 * слот, що очікує експонат. `tone` задає відтінок порожньої вітрини.
 *
 * Демо-зображення — Pexels (free-to-use); у продакшні — власний архів.
 */
export function MediaFrame({
  caption,
  src,
  alt = "",
  tone = "ash",
  className = "",
  aspect = "aspect-[4/3]",
  kenBurns = false,
}: {
  caption: string;
  src?: string;
  alt?: string;
  tone?: "ash" | "gold" | "crimson" | "steel";
  className?: string;
  aspect?: string;
  kenBurns?: boolean;
}) {
  const tones: Record<string, string> = {
    ash: "linear-gradient(150deg, #0B1C31, #09090C)",
    gold: "linear-gradient(150deg, #14314F, #09090C)",
    crimson: "linear-gradient(150deg, #3A1524, #09090C)",
    steel: "linear-gradient(150deg, #0D2138, #050507)",
  };
  return (
    <figure
      className={`group/frame relative overflow-hidden ${aspect} ${className}`}
      style={src ? undefined : { background: tones[tone] }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover [filter:saturate(0.55)_contrast(1.05)_brightness(0.82)] transition-transform duration-[2500ms] ease-in-out-slow ${
            kenBurns ? "scale-[1.04] group-hover/frame:scale-[1.1]" : "group-hover/frame:scale-[1.04]"
          }`}
        />
      )}
      {/* плівкова фактура */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, transparent 2px, transparent 5px)",
        }}
      />
      {/* віньєтка */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 120px 20px rgba(0,0,0,0.55)" }}
      />
      {/* нижній градієнт під підпис */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3">
        <span className="caption !text-cream/70">{caption}</span>
        <span className="text-cream/40">◱</span>
      </figcaption>
    </figure>
  );
}
