"use client";

import { useState } from "react";

interface Item { label: string; href: string; visible: boolean }

export default function AdminMenuPage() {
  const [items, setItems] = useState<Item[]>([
    { label: "Реєстр", href: "/defenders", visible: true },
    { label: "Карта", href: "/map", visible: true },
    { label: "Музей", href: "/museum", visible: true },
    { label: "Тексти", href: "/stories", visible: true },
    { label: "Про нас", href: "/about", visible: true },
  ]);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const n = [...items];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setItems(n);
  };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Меню</h1>
      <p className="mt-1 text-sm text-ink-lo">Головна навігація сайту</p>
      <ul className="mt-6 max-w-xl space-y-1.5">
        {items.map((it, i) => (
          <li key={it.href} className={`flex items-center gap-3 rounded-[4px] border border-hair px-4 py-3 ${it.visible ? "bg-white/[0.02]" : "opacity-45"}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-cream">{it.label}</p>
              <p className="font-mono text-[11px] text-ink-lo">{it.href}</p>
            </div>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30">↑</button>
            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30">↓</button>
            <button onClick={() => setItems(items.map((x, k) => (k === i ? { ...x, visible: !x.visible } : x)))} className="w-24 rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream">
              {it.visible ? "Приховати" : "Показати"}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-ink-lo">Збереження в конфіг сайту та вкладеність — наступний етап CMS.</p>
    </div>
  );
}
