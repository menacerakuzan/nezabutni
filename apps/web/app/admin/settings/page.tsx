"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("Незабутні");
  const [tagline, setTagline] = useState("Цифровий меморіал захисників Одеської області");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Налаштування</h1>
      <p className="mt-1 text-sm text-ink-lo">Платформа, SEO, інтеграції та безпека</p>

      <section className="mt-6 max-w-2xl space-y-4 border-t border-hair pt-6">
        <h2 className="caption">Загальні</h2>
        <div>
          <label className="block text-sm font-semibold text-cream" htmlFor="s-name">Назва платформи</label>
          <input id="s-name" type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1 w-full py-2.5 text-cream" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-cream" htmlFor="s-tag">Опис (SEO / OpenGraph)</label>
          <input id="s-tag" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1 w-full py-2.5 text-cream" />
        </div>
        <button disabled className="cursor-not-allowed rounded-[3px] border border-hair px-4 py-2 text-sm text-ink-faint" title="Збереження в конфіг — наступний етап">
          Зберегти (етап 2)
        </button>
      </section>

      <section className="mt-8 max-w-2xl border-t border-hair pt-6">
        <h2 className="caption">Інтеграції</h2>
        <ul className="mt-3 space-y-2.5 text-sm">
          {[
            ["PostgreSQL + PostGIS", "підключено", true],
            ["Тайли карти (CARTO dark)", "тимчасово, до власного tile-сервера", true],
            ["S3-медіасховище", "етап 2", false],
            ["SMTP-розсилки", "етап 2", false],
            ["BankID / Дія.Підпис", "етап 3", false],
            ["Street View / 360°-панорами", "етап 3", false],
          ].map(([name, note, ok]) => (
            <li key={name as string} className="flex items-center justify-between gap-4">
              <span className="text-cream">{name}</span>
              <span className={ok ? "text-good" : "text-ink-faint"}>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-2xl border-t border-hair pt-6">
        <h2 className="caption">Безпека (production-чекліст)</h2>
        <ul className="mt-3 space-y-2.5 text-sm">
          {[
            ["Параметризовані SQL-запити (захист від ін’єкцій)", true],
            ["JWT + перевірка ролей на admin-ендпоїнтах", true],
            ["Валідація вхідних даних (DTO)", true],
            ["CSP / HSTS заголовки", false],
            ["CSRF-токени для форм", false],
            ["Перевірка MIME-типів завантажень", false],
            ["Rate limiting входу", false],
            ["Автоматичні резервні копії БД", false],
            ["Шифроване зберігання секретів", false],
          ].map(([label, done]) => (
            <li key={label as string} className="flex items-center justify-between gap-4">
              <span className="text-ink">{label}</span>
              <span className={done ? "text-good" : "text-warn"}>{done ? "працює" : "у плані"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
