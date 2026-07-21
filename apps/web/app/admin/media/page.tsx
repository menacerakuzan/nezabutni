"use client";

/* eslint-disable @next/next/no-img-element */
import { MEDIA } from "../../../lib/media";

const ASSETS: { key: string; src: string; usage: string }[] = [
  { key: "chapelCandles", src: MEDIA.chapelCandles, usage: "Музей · вхідна зала" },
  { key: "cemeteryLanterns", src: MEDIA.cemeteryLanterns, usage: "Головна · фото-сцена, панорама" },
  { key: "redCandles", src: MEDIA.redCandles, usage: "Карта · картки меморіалів" },
  { key: "winterGrave", src: MEDIA.winterGrave, usage: "Профіль · архів" },
  { key: "framedPhoto", src: MEDIA.framedPhoto, usage: "Головна · портал музею" },
  { key: "odesaFlags", src: MEDIA.odesaFlags, usage: "Головна · портал карти" },
  { key: "crowdFlag", src: MEDIA.crowdFlag, usage: "Музей · обкладинки текстів" },
  { key: "bwCeremony", src: MEDIA.bwCeremony, usage: "Профіль · архів; карта" },
  { key: "march", src: MEDIA.march, usage: "Музей · обкладинки текстів" },
  { key: "archiveTable", src: MEDIA.archiveTable, usage: "Головна · маніфест; Про нас" },
  { key: "lettersString", src: MEDIA.lettersString, usage: "Профіль · вітрина 01" },
  { key: "letterPhoto", src: MEDIA.letterPhoto, usage: "Профіль · вітрина 02" },
];

export default function AdminMediaPage() {
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Медіатека</h1>
          <p className="mt-1 text-sm text-ink-lo">
            {ASSETS.length} демонстраційних матеріалів (Pexels, free-to-use)
          </p>
        </div>
        <button
          disabled
          className="cursor-not-allowed rounded-[3px] border border-hair px-4 py-2 text-sm text-ink-faint"
          title="Завантаження підключається до S3-сховища — наступний етап"
        >
          + Завантажити (етап 2)
        </button>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {ASSETS.map((a) => (
          <figure key={a.key} className="overflow-hidden rounded-[4px] border border-hair bg-white/[0.02]">
            <img
              src={a.src}
              alt=""
              loading="lazy"
              className="aspect-[4/3] w-full object-cover [filter:saturate(0.6)_brightness(0.85)]"
            />
            <figcaption className="p-3">
              <p className="truncate font-mono text-xs text-cream">{a.key}</p>
              <p className="mt-1 text-xs text-ink-lo">{a.usage}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-5 text-xs text-ink-lo">
        Продакшн-медіатека: S3-сховище, автоматична оптимізація (WebP/AVIF, розміри), теги, колекції
        та перевірка MIME-типів при завантаженні. Кожен файл знатиме, де він використовується.
      </p>
    </div>
  );
}
