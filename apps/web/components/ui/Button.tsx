import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "solid" | "line" | "text";

const base =
  "inline-flex items-center gap-2.5 font-medium transition-all duration-300 ease-out-expo " +
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-void " +
  "disabled:opacity-55 disabled:pointer-events-none";

// Editorial: гострі кути, друкований характер, без pill та без сяйва
const variants: Record<Variant, string> = {
  solid: "rounded-[3px] bg-cream px-6 py-3 text-sm text-void hover:bg-white",
  line: "rounded-[3px] border border-hair-strong px-6 py-3 text-sm text-ink-hi hover:border-cream hover:bg-white/[0.04]",
  text: "text-sm text-gold hover:text-gold-soft",
};

interface Common {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

function arrow() {
  return <span className="transition-transform duration-300 group-hover/btn:translate-x-1">→</span>;
}

export function Button({
  variant = "solid",
  className = "",
  children,
  ...rest
}: Common & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={`group/btn ${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
      {variant === "text" && arrow()}
    </button>
  );
}

export function ButtonLink({
  variant = "solid",
  className = "",
  href,
  children,
  ...rest
}: Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={`group/btn ${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
      {variant === "text" && arrow()}
    </Link>
  );
}
