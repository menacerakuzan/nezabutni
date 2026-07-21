"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";

/**
 * Лайтбокс: обгортає будь-який блок; клік відкриває повноекранний
 * перегляд зображення (Esc / клік — закрити, повторний клік — зум).
 */
export function Expandable({
  src,
  alt = "",
  caption,
  children,
  className = "",
}: {
  src: string;
  alt?: string;
  caption?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setZoom(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full cursor-zoom-in text-left ${className}`}
        aria-label={`Відкрити на весь екран: ${caption ?? alt}`}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <span className="caption">{caption}</span>
            <button
              onClick={close}
              aria-label="Закрити"
              className="text-2xl text-ink-lo transition-colors hover:text-cream"
            >
              ✕
            </button>
          </div>
          <div
            className={`flex-1 overflow-auto ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => !z);
            }}
          >
            <img
              src={src}
              alt={alt}
              className={`mx-auto transition-all duration-300 ${
                zoom ? "h-auto max-w-none scale-100 md:min-w-[130%]" : "h-full w-full object-contain"
              }`}
            />
          </div>
          <p className="px-6 py-4 text-center text-xs text-ink-lo">
            Клік — зум · Esc — закрити
          </p>
        </div>
      )}
    </>
  );
}
