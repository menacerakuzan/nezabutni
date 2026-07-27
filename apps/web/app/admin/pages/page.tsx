"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

/**
 * Візуальний редактор сторінок: кожна сторінка — послідовність блоків
 * дизайн-системи. Порядок і видимість зберігаються в таблиці page_block
 * через /site/admin/* — керує ChapterIntro-компоновкою реальних сторінок.
 */

interface Block {
  id: string;
  page: string;
  blockType: string;
  label: string;
  sortOrder: number;
  visible: boolean;
}

// Наразі в page_block заповнена лише «Головна» (prisma/seed-cms.ts).
// Інші сторінки поки збираються з коду напряму — додати блоки для них
// можна тим самим сідом, без змін цієї сторінки.
const PAGES = ["home", "defenders", "map", "museum", "about"];
const PAGE_LABEL: Record<string, string> = {
  home: "Головна",
  defenders: "Реєстр",
  map: "Карта",
  museum: "Музей",
  about: "Про нас",
};

export default function AdminPagesPage() {
  const [page, setPage] = useState("home");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // id блока, що зараз зберігається
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/site/admin/pages/${p}/blocks`);
      if (res.status === 403) {
        setError("Розділ доступний лише адміністраторам.");
        setBlocks([]);
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити блоки сторінки.");
        setBlocks([]);
        return;
      }
      setBlocks(await res.json());
    } catch {
      setError("Немає зв’язку із сервером.");
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const flashSaved = () => {
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt((t) => (t && Date.now() - t >= 1400 ? null : t)), 1500);
  };

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setBlocks(next); // оптимістично — інтерфейс не чекає мережі

    setSaving("reorder");
    const res = await authFetch("/site/admin/blocks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((b) => b.id) }),
    });
    setSaving(null);
    if (res.ok) {
      flashSaved();
      // sortOrder у відповіді сервера — джерело правди; підтягуємо повний список
      load(page);
    } else {
      setError("Не вдалося зберегти порядок — повертаю попередній.");
      load(page);
    }
  }

  async function toggle(b: Block) {
    setSaving(b.id);
    const nextVisible = !b.visible;
    setBlocks(blocks.map((x) => (x.id === b.id ? { ...x, visible: nextVisible } : x)));

    const res = await authFetch(`/site/admin/blocks/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: nextVisible }),
    });
    setSaving(null);
    if (res.ok) {
      flashSaved();
    } else {
      setError("Не вдалося зберегти видимість — повертаю попередній стан.");
      setBlocks(blocks.map((x) => (x.id === b.id ? { ...x, visible: b.visible } : x)));
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Сторінки</h1>
          <p className="mt-1 text-sm text-ink-lo">
            Кожна сторінка складається з блоків дизайн-системи — як експозиція із залів
          </p>
        </div>
        <p className="text-xs text-ink-faint" aria-live="polite">
          {saving ? "Зберігаємо…" : savedAt ? "Збережено ✓" : ""}
        </p>
      </header>

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
            {PAGE_LABEL[p] ?? p}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>
      )}

      {!error && loading && <p className="mt-8 text-sm text-ink-lo">Завантаження…</p>}

      {!error && !loading && blocks.length === 0 && (
        <p className="mt-8 rounded-[4px] border border-hair p-5 text-sm text-ink">
          Для сторінки «{PAGE_LABEL[page] ?? page}» ще не додано блоків у page_block.
        </p>
      )}

      {!error && blocks.length > 0 && (
        <ul className="mt-6 space-y-1.5">
          {blocks.map((b, i) => (
            <li
              key={b.id}
              className={`flex items-center gap-3 rounded-[4px] border border-hair px-4 py-3 transition-opacity ${
                b.visible ? "bg-white/[0.02]" : "opacity-45"
              } ${saving === b.id || saving === "reorder" ? "opacity-70" : ""}`}
            >
              <span className="w-6 text-center font-mono text-xs text-ink-faint">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-cream">{b.label}</p>
                <p className="font-mono text-[11px] text-ink-lo">{b.blockType}</p>
              </div>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0 || !!saving}
                aria-label="Вгору"
                className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === blocks.length - 1 || !!saving}
                aria-label="Вниз"
                className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30"
              >
                ↓
              </button>
              <button
                onClick={() => toggle(b)}
                disabled={!!saving}
                className="w-24 rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30"
              >
                {b.visible ? "Приховати" : "Показати"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-ink-lo">
        Зміни зберігаються одразу — окремої кнопки «Зберегти» не потрібно.
      </p>
    </div>
  );
}
