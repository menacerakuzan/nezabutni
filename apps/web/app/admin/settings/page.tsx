"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

interface Settings {
  siteName: string;
  tagline: string;
  contactEmail: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/site/settings");
      if (!res.ok) {
        setError("Не вдалося завантажити налаштування.");
        return;
      }
      const data = await res.json();
      setSettings(data);
      setDraft(data);
    } catch {
      setError("Немає зв’язку із сервером.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const res = await authFetch("/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (res.status === 403) {
      setError("Зміна налаштувань доступна лише адміністраторам.");
      return;
    }
    if (!res.ok) {
      setError("Не вдалося зберегти налаштування.");
      return;
    }
    const data = await res.json();
    setSettings(data);
    setDraft(data);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt((t) => (t && Date.now() - t >= 1400 ? null : t)), 1500);
  }

  const dirty = settings && draft && JSON.stringify(settings) !== JSON.stringify(draft);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Налаштування</h1>
      <p className="mt-1 text-sm text-ink-lo">Платформа, SEO, інтеграції та безпека</p>

      <section className="mt-6 max-w-2xl space-y-4 border-t border-hair pt-6">
        <h2 className="caption">Загальні</h2>

        {error && <p className="border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>}

        {loading ? (
          <p className="text-sm text-ink-lo">Завантаження…</p>
        ) : draft ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-cream" htmlFor="s-name">Назва платформи</label>
              <input
                id="s-name"
                type="text"
                value={draft.siteName}
                onChange={(e) => setDraft({ ...draft, siteName: e.target.value })}
                className="mt-1 w-full py-2.5 text-cream"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cream" htmlFor="s-tag">Опис (SEO / OpenGraph)</label>
              <input
                id="s-tag"
                type="text"
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                className="mt-1 w-full py-2.5 text-cream"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cream" htmlFor="s-email">Контактна пошта</label>
              <input
                id="s-email"
                type="email"
                value={draft.contactEmail}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                className="mt-1 w-full py-2.5 text-cream"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Зберігаємо…" : "Зберегти"}
              </button>
              {savedAt && <span className="text-xs text-good">Збережено ✓</span>}
            </div>
          </>
        ) : null}
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
