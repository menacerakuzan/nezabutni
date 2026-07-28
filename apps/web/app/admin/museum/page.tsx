"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface ExhibitRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  coverMediaId: string | null;
  status: "draft" | "published";
  createdAt: string;
}

export default function AdminMuseumPage() {
  const [items, setItems] = useState<ExhibitRow[]>([]);
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
      const res = await authFetch("/admin/exhibits");
      if (res.status === 403) {
        setError("Розділ доступний лише адміністраторам.");
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити зали музею.");
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

  function startEdit(e: ExhibitRow) {
    setEditingId(e.id);
    setTitle(e.title);
    setSummary(e.summary ?? "");
    setBody(e.body);
    setCover(e.coverMediaId ? { id: e.coverMediaId, url: `${API_URL}/media/file/${e.coverMediaId}` } : null);
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
      ? await authFetch(`/admin/exhibits/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await authFetch("/admin/exhibits", {
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

  async function setStatus(e: ExhibitRow, status: "draft" | "published") {
    setBusy(e.id);
    const res = await authFetch(`/admin/exhibits/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) load();
    else setError("Не вдалося змінити статус публікації.");
  }

  async function remove(e: ExhibitRow) {
    if (!confirm(`Видалити залу «${e.title}»?`)) return;
    setBusy(e.id);
    const res = await authFetch(`/admin/exhibits/${e.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setItems(items.filter((x) => x.id !== e.id));
    else setError("Не вдалося видалити залу.");
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Онлайн-музей</h1>
          <p className="mt-1 text-sm text-ink-lo">Зали експозиції — показуються на /museum</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white"
        >
          {showForm ? "Скасувати" : "+ Нова зала"}
        </button>
      </header>

      {error && <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>}

      {showForm && (
        <form onSubmit={submitForm} className="mt-6 max-w-2xl space-y-4 rounded-[4px] border border-hair p-5">
          <h2 className="font-display text-lg font-semibold text-cream">{editingId ? "Редагування" : "Нова зала"}</h2>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="e-title">Назва зали</label>
            <input id="e-title" required value={title} onChange={(ev) => setTitle(ev.target.value)} className="mt-1 w-full py-2.5 text-cream" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="e-summary">Короткий опис</label>
            <input id="e-summary" value={summary} onChange={(ev) => setSummary(ev.target.value)} className="mt-1 w-full py-2.5 text-cream" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="e-body">Текст (абзаци — через порожній рядок)</label>
            <textarea id="e-body" required rows={8} value={body} onChange={(ev) => setBody(ev.target.value)} className="mt-1 w-full rounded-[3px] border border-hair bg-transparent px-3 py-2.5 text-sm text-cream outline-none" />
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
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(ev) => ev.target.files?.[0] && uploadCover(ev.target.files[0])} />
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
          {items.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <button onClick={() => startEdit(e)} className="truncate text-sm font-semibold text-cream hover:text-gold">{e.title}</button>
                <p className="text-xs text-ink-lo">{new Date(e.createdAt).toLocaleDateString("uk-UA")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setStatus(e, e.status === "published" ? "draft" : "published")}
                  disabled={busy === e.id}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${e.status === "published" ? "bg-good/15 text-good" : "bg-warn/15 text-warn"}`}
                >
                  {e.status === "published" ? "Опубліковано" : "Чернетка"}
                </button>
                <button onClick={() => remove(e)} disabled={busy === e.id} className="rounded border border-hair px-2 py-1 text-xs text-crimson-bright hover:border-crimson-bright disabled:opacity-50">
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="mt-8 text-sm text-ink-lo">Зал ще немає.</p>
      )}
    </div>
  );
}
