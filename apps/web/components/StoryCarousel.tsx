"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface StorySummary {
  slug: string;
  title: string;
  summary: string | null;
}

const ROTATE_MS = 7000;

export function StoryCarousel() {
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    fetch(`${apiUrl}/stories`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setStories(d.items ?? []));
  }, []);

  useEffect(() => {
    if (stories.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % stories.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [stories.length]);

  if (stories.length === 0) return null;
  const current = stories[index];
  if (!current) return null;

  return (
    <div className="border-t border-hair pt-10">
      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.article
            key={current.slug}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[11px] uppercase text-gold-soft">
              Історія {index + 1} з {stories.length}
            </span>
            <Link href={`/stories/${current.slug}`} className="group mt-4 block">
              <h3 className="max-w-4xl font-display text-3xl font-semibold leading-tight text-cream transition-colors group-hover:text-gold md:text-4xl">
                {current.title}
              </h3>
            </Link>
            {current.summary && <p className="mt-4 max-w-prose text-lg text-ink">{current.summary}</p>}
            <Link
              href={`/stories/${current.slug}`}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-soft"
            >
              Читати повністю →
            </Link>
          </motion.article>
        </AnimatePresence>
      </div>

      {stories.length > 1 && (
        <div className="mt-8 flex items-center gap-2">
          {stories.map((s, i) => (
            <button
              key={s.slug}
              onClick={() => setIndex(i)}
              aria-label={`Показати: ${s.title}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-gold" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
