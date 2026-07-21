"use client";

import { useState } from "react";

/**
 * Візуальний редактор сторінок: кожна сторінка — послідовність блоків
 * дизайн-системи. Порядок і видимість працюють локально; збереження в
 * БД (layout-конфіг сторінки) — наступний етап.
 */

interface Block {
  id: string;
  type: string;
  label: string;
  visible: boolean;
}

const HOME_BLOCKS: Block[] = [
  { id: "field", type: "FieldOfLights", label: "Поле вогнів (мапа області)", visible: true },
  { id: "manifest", type: "ChapterIntro + Media", label: "Маніфест «Ми зберігаємо людей»", visible: true },
  { id: "scene", type: "PhotoScene", label: "Фото-сцена «Вечір пам’яті»", visible: true },
  { id: "quote", type: "FullscreenQuote", label: "Цитата на весь екран", visible: true },
  { id: "stories", type: "CinematicStory ×2", label: "Історії, які зберігають родини", visible: true },
  { id: "wall", type: "MemorialWall", label: "Стіна пам’яті", visible: true },
  { id: "space", type: "PortalTiles", label: "Карта + Музей (портали)", visible: true },
  { id: "texts", type: "StoryCarousel", label: "Тексти пам’яті", visible: true },
  { id: "continue", type: "ContinueExploring", label: "Продовжити дослідження", visible: true },
  { id: "cta", type: "CtaHall", label: "Заклик «Подати ім’я»", visible: true },
];

const PAGES = ["Головна", "Реєстр", "Профіль захисника", "Карта", "Музей", "Про нас"];

export default function AdminPagesPage() {
  const [page, setPage] = useState("Головна");
  const [blocks, setBlocks] = useState<Block[]>(HOME_BLOCKS);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setBlocks(next);
  };
  const toggle = (i: number) =>
    setBlocks(blocks.map((b, k) => (k === i ? { ...b, visible: !b.visible } : b)));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Сторінки</h1>
      <p className="mt-1 text-sm text-ink-lo">
        Кожна сторінка складається з блоків дизайн-системи — як експозиція із залів
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`rounded-[3px] border px-3.5 py-1.5 text-sm transition-colors ${
              page === p
                ? "border-cream bg-white/[0.06] font-semibold text-cream"
                : "border-hair text-ink hover:border-hair-strong hover:text-cream"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {page === "Головна" ? (
        <ul className="mt-6 space-y-1.5">
          {blocks.map((b, i) => (
            <li
              key={b.id}
              className={`flex items-center gap-3 rounded-[4px] border border-hair px-4 py-3 ${
                b.visible ? "bg-white/[0.02]" : "opacity-45"
              }`}
            >
              <span className="w-6 text-center font-mono text-xs text-ink-faint">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-cream">{b.label}</p>
                <p className="font-mono text-[11px] text-ink-lo">{b.type}</p>
              </div>
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Вгору" className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Вниз" className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30">↓</button>
              <button onClick={() => toggle(i)} className="w-24 rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream">
                {b.visible ? "Приховати" : "Показати"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-[4px] border border-hair p-5 text-sm text-ink">
          Блокова структура сторінки «{page}» підключається після збереження layout-конфігів у БД.
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          disabled
          className="cursor-not-allowed rounded-[3px] border border-hair px-4 py-2 text-sm text-ink-faint"
          title="Збереження layout-конфігу в БД — наступний етап"
        >
          Зберегти зміни (етап 2)
        </button>
        <p className="text-xs text-ink-lo">Порядок і видимість зараз працюють локально, без збереження.</p>
      </div>
    </div>
  );
}
