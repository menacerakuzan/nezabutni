/**
 * Монохромний фірмовий знак (public/logo-mark.svg) як CSS-маска —
 * фарбується через currentColor/background-color без інлайну ~14KB path-даних.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block bg-current ${className}`}
      style={{
        aspectRatio: "417 / 525",
        WebkitMaskImage: "url(/logo-mark.svg)",
        maskImage: "url(/logo-mark.svg)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      role="img"
      aria-label="Незабутні"
    />
  );
}
