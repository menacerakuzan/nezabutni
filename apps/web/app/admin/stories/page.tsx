"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface StoryRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  coverMediaId: string | null;
  status: "draft" | "published";
  createdAt: string;
}

export default function AdminStoriesPage() {
  const [items, setItems] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState<{ id: string; url: string } | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/admin/stories");
      if (res.status === 403) {
        setError("Розділ доступний лише адміністраторам.");
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити тексти пам’яті.");
        return;
      }
      setItems(await res.json());
    } catch {
      setError("Немає зв’язку із сервером.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSummary("");
    setBody("");
    setCover(null);
    setCoverError(null);
    setFormError(null);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(s: StoryRow) {
    setEditingId(s.id);
    setTitle(s.title);
    setSummary(s.summary ?? "");
    setBody(s.body);
    setCover(s.coverMediaId ? { id: s.coverMediaId, url: `${API_URL}/media/file/${s.coverMediaId}` } : null);
    setCoverError(null);
    setFormError(null);
    setShowForm(true);
  }

  async function uploadCover(file: File) {
    setCoverError(null);
    setCoverBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await authFetch("/media/upload", { method: "POST", body: fd });
    setCoverBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setCoverError(data?.message ?? "Не вдалося завантажити фото.");
      return;
    }
    setCover({ id: data.id, url: `${API_URL}${(data.url as string).replace("/api/v1", "")}` });
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      title: title.trim(),
      summary: summary.trim() || undefined,
      body: body.trim(),
      coverMediaId: cover?.id,
    };
    const res = editingId
      ? await authFetch(`/admin/stories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await authFetch("/admin/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (res.ok) {
      resetForm();
      setShowForm(false);
      load();
    } else {
      const b = await res.json().catch(() => null);
      setFormError(b?.message ?? "Не вдалося зберегти.");
    }
  }

  async function setStatus(s: StoryRow, status: "draft" | "published") {
    setBusy(s.id);
    const res = await authFetch(`/admin/stories/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) load();
    else setError("Не вдалося змінити статус публікації.");
  }

  async function remove(s: StoryRow) {
    if (!confirm(`Видалити історію «${s.title}»?`)) return;
    setBusy(s.id);
    const res = await authFetch(`/admin/stories/${s.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setItems(items.filter((x) => x.id !== s.id));
    else setError("Не вдалося видалити історію.");
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Тексти пам’яті</h1>
          <p className="mt-1 text-sm text-ink-lo">Кураторські історії, що показуються на /stories та /museum</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white"
        >
          {showForm ? "Скасувати" : "+ Нова історія"}
        </button>
      </header>

      {error && <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>}

      {showForm && (
        <form onSubmit={submitForm} className="mt-6 max-w-2xl space-y-4 rounded-[4px] border border-hair p-5">
          <h2 className="font-display text-lg font-semibold text-cream">{editingId ? "Редагування" : "Нова історія"}</h2>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="s-title">Заголовок</label>
            <input id="s-title" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full py-2.5 text-cream" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="s-summary">Короткий опис</label>
            <input id="s-summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 w-full py-2.5 text-cream" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="s-body">Текст (абзаци — через порожній рядок)</label>
            <textarea id="s-body" required rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 w-full rounded-[3px] border border-hair bg-transparent px-3 py-2.5 text-sm text-cream outline-none" />
          </div>
          <div>
            <p className="block text-sm font-semibold text-cream">Обкладинка</p>
            {cover ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.url} alt="" className="h-20 w-32 rounded-[3px] object-cover" />
                <button type="button" onClick={() => setCover(null)} className="text-xs text-ink-lo hover:text-crimson-bright">Прибрати</button>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                role="button"
                tabIndex={0}
                className="mt-2 cursor-pointer rounded-[3px] border border-dashed border-hair-strong px-4 py-6 text-center text-sm text-ink-lo hover:border-cream"
              >
                {coverBusy ? "Завантажуємо…" : "Натисніть, щоб додати фото"}
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
              </div>
            )}
            {coverError && <p className="mt-1.5 text-xs text-crimson-bright">{coverError}</p>}
          </div>
          {formError && <p className="border-l-2 border-crimson-bright pl-4 text-sm text-ink">{formError}</p>}
          <button type="submit" disabled={saving} className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white disabled:opacity-50">
            {saving ? "Зберігаємо…" : editingId ? "Зберегти зміни" : "Створити чернетку"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-ink-lo">Завантаження…</p>
      ) : items.length > 0 ? (
        <ul className="mt-8 max-w-2xl divide-y divide-hair border-y border-hair">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <button onClick={() => startEdit(s)} className="truncate text-sm font-semibold text-cream hover:text-gold">{s.title}</button>
                <p className="text-xs text-ink-lo">{new Date(s.createdAt).toLocaleDateString("uk-UA")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setStatus(s, s.status === "published" ? "draft" : "published")}
                  disabled={busy === s.id}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${s.status === "published" ? "bg-good/15 text-good" : "bg-warn/15 text-warn"}`}
                >
                  {s.status === "published" ? "Опубліковано" : "Чернетка"}
                </button>
                <button onClick={() => remove(s)} disabled={busy === s.id} className="rounded border border-hair px-2 py-1 text-xs text-crimson-bright hover:border-crimson-bright disabled:opacity-50">
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="mt-8 text-sm text-ink-lo">Історій ще немає.</p>
      )}
    </div>
  );
}
