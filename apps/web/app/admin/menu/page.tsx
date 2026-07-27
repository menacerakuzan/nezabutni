"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

/**
 * Навігація сайту — хедер і три колонки футера. Дані з menu_item через
 * /site/admin/menu; та сама таблиця, з якої Header і Footer читають
 * публічне меню (/site/menu).
 */

interface Item {
  id: string;
  label: string;
  href: string;
  location: string;
  sortOrder: number;
  visible: boolean;
}

const LOCATIONS = ["header", "footer_memorial", "footer_platform", "footer_join"] as const;
const LOCATION_LABEL: Record<string, string> = {
  header: "Хедер",
  footer_memorial: "Футер · Меморіал",
  footer_platform: "Футер · Платформа",
  footer_join: "Футер · Долучитися",
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { label: string; href: string }>>({});
  const [newItem, setNewItem] = useState<Record<string, { label: string; href: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/site/admin/menu");
      if (res.status === 403) {
        setError("Розділ доступний лише адміністраторам.");
        setItems([]);
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити меню.");
        setItems([]);
        return;
      }
      const data: Item[] = await res.json();
      setItems(data);
      setDrafts(Object.fromEntries(data.map((i) => [i.id, { label: i.label, href: i.href }])));
    } catch {
      setError("Немає зв’язку із сервером.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flashSaved = () => {
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt((t) => (t && Date.now() - t >= 1400 ? null : t)), 1500);
  };

  async function move(location: string, i: number, dir: -1 | 1) {
    const group = items.filter((x) => x.location === location);
    const j = i + dir;
    if (j < 0 || j >= group.length) return;
    const a = group[i]!;
    const b = group[j]!;
    setItems(items.map((x) => (x.id === a.id ? { ...x, sortOrder: b.sortOrder } : x.id === b.id ? { ...x, sortOrder: a.sortOrder } : x)));

    setSaving(a.id);
    const [r1, r2] = await Promise.all([
      authFetch(`/site/admin/menu/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: b.sortOrder }) }),
      authFetch(`/site/admin/menu/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: a.sortOrder }) }),
    ]);
    setSaving(null);
    if (r1.ok && r2.ok) flashSaved();
    else {
      setError("Не вдалося зберегти порядок.");
      load();
    }
  }

  async function toggle(it: Item) {
    setSaving(it.id);
    const nextVisible = !it.visible;
    setItems(items.map((x) => (x.id === it.id ? { ...x, visible: nextVisible } : x)));
    const res = await authFetch(`/site/admin/menu/${it.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: nextVisible }),
    });
    setSaving(null);
    if (res.ok) flashSaved();
    else {
      setError("Не вдалося зберегти видимість.");
      setItems(items.map((x) => (x.id === it.id ? { ...x, visible: it.visible } : x)));
    }
  }

  async function saveEdit(it: Item) {
    const draft = drafts[it.id];
    if (!draft || (draft.label === it.label && draft.href === it.href)) return;
    setSaving(it.id);
    const res = await authFetch(`/site/admin/menu/${it.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(null);
    if (res.ok) {
      setItems(items.map((x) => (x.id === it.id ? { ...x, ...draft } : x)));
      flashSaved();
    } else {
      setError("Не вдалося зберегти пункт меню.");
    }
  }

  async function remove(it: Item) {
    if (!confirm(`Видалити пункт «${it.label}»?`)) return;
    setSaving(it.id);
    const res = await authFetch(`/site/admin/menu/${it.id}`, { method: "DELETE" });
    setSaving(null);
    if (res.ok) {
      setItems(items.filter((x) => x.id !== it.id));
      flashSaved();
    } else {
      setError("Не вдалося видалити пункт меню.");
    }
  }

  async function create(location: string) {
    const draft = newItem[location];
    if (!draft?.label?.trim() || !draft?.href?.trim()) return;
    setSaving(`new-${location}`);
    const res = await authFetch("/site/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: draft.label.trim(), href: draft.href.trim(), location }),
    });
    setSaving(null);
    if (res.ok) {
      setNewItem((n) => ({ ...n, [location]: { label: "", href: "" } }));
      load();
    } else {
      setError("Не вдалося додати пункт меню.");
    }
  }

  if (loading) return <p className="text-sm text-ink-lo">Завантаження…</p>;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Меню</h1>
          <p className="mt-1 text-sm text-ink-lo">Хедер і колонки футера — та сама навігація, що бачать відвідувачі</p>
        </div>
        <p className="text-xs text-ink-faint" aria-live="polite">
          {saving ? "Зберігаємо…" : savedAt ? "Збережено ✓" : ""}
        </p>
      </header>

      {error && <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>}

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {LOCATIONS.map((location) => {
          const group = items.filter((x) => x.location === location).sort((a, b) => a.sortOrder - b.sortOrder);
          const draft = newItem[location] ?? { label: "", href: "" };
          return (
            <section key={location}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-lo">{LOCATION_LABEL[location]}</h2>
              <ul className="mt-3 space-y-1.5">
                {group.map((it, i) => (
                  <li key={it.id} className={`rounded-[4px] border border-hair px-4 py-3 ${it.visible ? "bg-white/[0.02]" : "opacity-45"}`}>
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <input
                          value={drafts[it.id]?.label ?? it.label}
                          onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: { ...d[it.id]!, label: e.target.value } }))}
                          onBlur={() => saveEdit(it)}
                          className="w-full bg-transparent text-sm font-semibold text-cream outline-none focus:border-b focus:border-hair-strong"
                        />
                        <input
                          value={drafts[it.id]?.href ?? it.href}
                          onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: { ...d[it.id]!, href: e.target.value } }))}
                          onBlur={() => saveEdit(it)}
                          className="w-full bg-transparent font-mono text-[11px] text-ink-lo outline-none focus:border-b focus:border-hair-strong"
                        />
                      </div>
                      <button onClick={() => move(location, i, -1)} disabled={i === 0} className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30">↑</button>
                      <button onClick={() => move(location, i, 1)} disabled={i === group.length - 1} className="rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream disabled:opacity-30">↓</button>
                      <button onClick={() => toggle(it)} className="w-24 rounded border border-hair px-2 py-1 text-xs text-ink hover:text-cream">
                        {it.visible ? "Приховати" : "Показати"}
                      </button>
                      <button onClick={() => remove(it)} className="rounded border border-hair px-2 py-1 text-xs text-crimson-bright hover:border-crimson-bright">
                        Видалити
                      </button>
                    </div>
                  </li>
                ))}
                {!group.length && <p className="text-xs text-ink-faint">Немає пунктів.</p>}
              </ul>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={draft.label}
                  onChange={(e) => setNewItem((n) => ({ ...n, [location]: { ...draft, label: e.target.value } }))}
                  placeholder="Назва"
                  className="w-32 rounded border border-hair bg-transparent px-2 py-1.5 text-xs text-cream outline-none placeholder:text-ink-faint"
                />
                <input
                  value={draft.href}
                  onChange={(e) => setNewItem((n) => ({ ...n, [location]: { ...draft, href: e.target.value } }))}
                  placeholder="/шлях"
                  className="w-32 rounded border border-hair bg-transparent px-2 py-1.5 font-mono text-xs text-cream outline-none placeholder:text-ink-faint"
                />
                <button onClick={() => create(location)} className="rounded border border-hair px-3 py-1.5 text-xs text-ink hover:border-cream hover:text-cream">
                  + Додати
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
