"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Емоційна пауза на весь екран: велика цитата, що поволі проявляється й
 * ледь зміщується при скролі. Один із «залів тиші» експозиції.
 */
export function FullscreenQuote({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.2, 1, 1, 0.2]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[86vh] items-center justify-center overflow-hidden px-6"
    >
      <div className="pointer-events-none absolute inset-0 candle-veil opacity-70" />
      <motion.blockquote style={{ y, opacity }} className="relative mx-auto max-w-5xl text-center">
        <p className="font-display text-3xl font-medium leading-[1.18] text-cream md:text-6xl [text-wrap:balance]">
          {quote}
        </p>
        <footer className="mt-10">
          <span className="font-display text-lg text-gold">{author}</span>
          {role && <span className="mt-1 block caption">{role}</span>}
        </footer>
      </motion.blockquote>
    </section>
  );
}
