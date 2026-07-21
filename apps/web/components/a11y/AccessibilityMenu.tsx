"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Меню доступності: 12 режимів (кольорові фільтри, текст, курсор, медіа).
 * Кольорові фільтри застосовуються через fixed-оверлей з backdrop-filter —
 * це не ламає fixed-позиціювання хедера, на відміну від filter на html.
 * Решта режимів — data-атрибути на <html> + CSS у globals.
 * Налаштування зберігаються в localStorage.
 */

type ColorMode = "none" | "invert" | "gray" | "desat" | "contrast";

interface A11y {
  color: ColorMode;
  links: boolean;
  textSize: 0 | 1 | 2;
  lineHeight: boolean;
  letterSpacing: boolean;
  alignLeft: boolean;
  hideImages: boolean;
  hideVideo: boolean;
  bigCursor: boolean;
}

const DEFAULTS: A11y = {
  color: "none",
  links: false,
  textSize: 0,
  lineHeight: false,
  letterSpacing: false,
  alignLeft: false,
  hideImages: false,
  hideVideo: false,
  bigCursor: false,
};

const STORAGE_KEY = "nezabutni-a11y";

const FILTERS: Record<ColorMode, string> = {
  none: "",
  invert: "invert(1) hue-rotate(180deg)",
  gray: "grayscale(1)",
  desat: "saturate(0.4)",
  contrast: "contrast(1.3) brightness(1.05)",
};

function applyToHtml(s: A11y) {
  const el = document.documentElement;
  const set = (attr: string, on: boolean | string) => {
    if (on === false || on === "" || on === "0") el.removeAttribute(attr);
    else el.setAttribute(attr, on === true ? "" : String(on));
  };
  set("data-a11y-links", s.links);
  set("data-a11y-textsize", s.textSize === 0 ? "" : String(s.textSize));
  set("data-a11y-lineheight", s.lineHeight);
  set("data-a11y-letter", s.letterSpacing);
  set("data-a11y-left", s.alignLeft);
  set("data-a11y-noimg", s.hideImages);
  set("data-a11y-novideo", s.hideVideo);
  set("data-a11y-cursor", s.bigCursor);
}

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<A11y>(DEFAULTS);

  // відновлення збережених налаштувань
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as A11y;
        setS(parsed);
        applyToHtml(parsed);
      }
    } catch {
      /* ігноруємо пошкоджені дані */
    }
  }, []);

  const update = useCallback((patch: Partial<A11y>) => {
    setS((prev) => {
      const next = { ...prev, ...patch };
      applyToHtml(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* приватний режим */
      }
      return next;
    });
  }, []);

  const reset = () => update({ ...DEFAULTS });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const anyActive =
    s.color !== "none" ||
    s.links ||
    s.textSize > 0 ||
    s.lineHeight ||
    s.letterSpacing ||
    s.alignLeft ||
    s.hideImages ||
    s.hideVideo ||
    s.bigCursor;

  const Tile = ({
    label,
    active,
    onClick,
    icon,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
    icon: string;
  }) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center gap-2 rounded-[6px] border p-4 text-center transition-colors ${
        active
          ? "border-gold bg-gold/10 text-cream"
          : "border-hair bg-white/[0.02] text-ink hover:border-hair-strong hover:text-cream"
      }`}
    >
      <span aria-hidden="true" className="text-xl leading-none">{icon}</span>
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </button>
  );

  return (
    <>
      {/* кольоровий фільтр — оверлей, що не ламає fixed-елементи */}
      {s.color !== "none" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[70]"
          style={{ backdropFilter: FILTERS[s.color], WebkitBackdropFilter: FILTERS[s.color] }}
        />
      )}

      {/* кнопка виклику */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Меню доступності"
        title="Меню доступності"
        className={`fixed bottom-5 left-5 z-[75] flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-colors ${
          anyActive
            ? "border-gold bg-gold text-void"
            : "border-hair-strong bg-[#0B0F16] text-cream hover:border-cream"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="5" r="2.2" fill="currentColor" />
          <path
            d="M4.5 8.5c2.5.7 5 1 7.5 1s5-.3 7.5-1M12 9.5v4m0 0-2.8 6m2.8-6 2.8 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* панель */}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-start bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Меню доступності"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[8px] border border-hair-strong bg-[#0B0F16] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold text-cream">Меню доступності</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Закрити меню"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-hair text-ink hover:border-cream hover:text-cream"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <Tile icon="◐" label="Інвертувати кольори" active={s.color === "invert"} onClick={() => update({ color: s.color === "invert" ? "none" : "invert" })} />
              <Tile icon="◑" label="Чорно-біле" active={s.color === "gray"} onClick={() => update({ color: s.color === "gray" ? "none" : "gray" })} />
              <Tile icon="🎨" label="Низька насиченість" active={s.color === "desat"} onClick={() => update({ color: s.color === "desat" ? "none" : "desat" })} />
              <Tile icon="🔗" label="Підсвічування посилань" active={s.links} onClick={() => update({ links: !s.links })} />
              <Tile icon="Тт" label={s.textSize === 0 ? "Великий текст" : `Великий текст ·${s.textSize}`} active={s.textSize > 0} onClick={() => update({ textSize: ((s.textSize + 1) % 3) as 0 | 1 | 2 })} />
              <Tile icon="↕" label="Міжрядковий інтервал" active={s.lineHeight} onClick={() => update({ lineHeight: !s.lineHeight })} />
              <Tile icon="↔" label="Текстовий інтервал" active={s.letterSpacing} onClick={() => update({ letterSpacing: !s.letterSpacing })} />
              <Tile icon="≡" label="Вирівнювання тексту" active={s.alignLeft} onClick={() => update({ alignLeft: !s.alignLeft })} />
              <Tile icon="◉" label="Контраст" active={s.color === "contrast"} onClick={() => update({ color: s.color === "contrast" ? "none" : "contrast" })} />
              <Tile icon="🖼" label="Приховати зображення" active={s.hideImages} onClick={() => update({ hideImages: !s.hideImages })} />
              <Tile icon="🎬" label="Приховати відео" active={s.hideVideo} onClick={() => update({ hideVideo: !s.hideVideo })} />
              <Tile icon="↖" label="Курсор" active={s.bigCursor} onClick={() => update({ bigCursor: !s.bigCursor })} />
            </div>

            <button
              onClick={reset}
              className="mt-5 w-full rounded-full bg-cream px-4 py-3 text-sm font-bold text-void transition-colors hover:bg-white"
            >
              Скинути налаштування
            </button>
          </div>
        </div>
      )}
    </>
  );
}
