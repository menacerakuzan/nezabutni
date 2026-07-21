"use client";

import { useState } from "react";

interface Draft { title: string; category: string; status: "draft" | "scheduled"; date: string }

export default function AdminNewsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Оголошення");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Новини</h1>
      <p className="mt-1 text-sm text-ink-lo">Оголошення платформи, події громад, пам’ятні дати</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setDrafts([{ title: title.trim(), category, status: "draft", date: new Date().toLocaleDateString("uk-UA") }, ...drafts]);
          setTitle("");
        }}
        className="mt-6 max-w-2xl space-y-4 border-t border-hair pt-6"
      >
        <div>
          <label className="block text-sm font-semibold text-cream" htmlFor="n-title">Заголовок</label>
          <input id="n-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр.: Відкрито нову експозицію музею" className="mt-1 w-full py-2.5 text-cream" />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="n-cat">Категорія</label>
            <select id="n-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 py-2.5 text-cream">
              <option>Оголошення</option>
              <option>Події</option>
              <option>Пам’ятні дати</option>
              <option>Оновлення платформи</option>
            </select>
          </div>
          <button type="submit" className="rounded-[3px] bg-cream px-4 py-2.5 text-sm font-semibold text-void hover:bg-white">
            Створити чернетку
          </button>
        </div>
      </form>

      {drafts.length > 0 && (
        <ul className="mt-8 max-w-2xl divide-y divide-hair border-y border-hair">
          {drafts.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold text-cream">{d.title}</p>
                <p className="text-xs text-ink-lo">{d.category} · {d.date}</p>
              </div>
              <span className="rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-medium text-warn">Чернетка</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 text-xs text-ink-lo">
        Публікація, SEO-поля, теги й відкладений вихід — після підключення news-таблиць API (схема вже в docs/db).
      </p>
    </div>
  );
}
