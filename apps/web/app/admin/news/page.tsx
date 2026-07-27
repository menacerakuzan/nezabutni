"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  body: string;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  author: { displayName: string } | null;
}

const CATEGORIES = ["Оголошення", "Події", "Пам'ятні дати", "Оновлення платформи"];

export default function AdminNewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/admin/news");
      if (res.status === 403) {
        setError("Розділ доступний адміністраторам і редакторам.");
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити новини.");
        return;
      }
      setPosts(await res.json());
    } catch {
      setError("Немає зв’язку із сервером.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy("create");
    const res = await authFetch("/admin/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), category, excerpt: excerpt.trim() || undefined, body: body.trim() }),
    });
    setBusy(null);
    if (res.ok) {
      setTitle("");
      setExcerpt("");
      setBody("");
      load();
    } else {
      setError("Не вдалося створити чернетку.");
    }
  }

  async function setStatus(p: Post, status: "draft" | "published") {
    setBusy(p.id);
    const res = await authFetch(`/admin/news/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) load();
    else setError("Не вдалося змінити статус публікації.");
  }

  async function remove(p: Post) {
    if (!confirm(`Видалити новину «${p.title}»?`)) return;
    setBusy(p.id);
    const res = await authFetch(`/admin/news/${p.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setPosts(posts.filter((x) => x.id !== p.id));
    else setError("Не вдалося видалити новину.");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Новини</h1>
      <p className="mt-1 text-sm text-ink-lo">Оголошення платформи, події громад, пам’ятні дати</p>

      <form onSubmit={createDraft} className="mt-6 max-w-2xl space-y-4 border-t border-hair pt-6">
        <div>
          <label className="block text-sm font-semibold text-cream" htmlFor="n-title">Заголовок</label>
          <input id="n-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр.: Відкрито нову експозицію музею" className="mt-1 w-full py-2.5 text-cream" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-cream" htmlFor="n-excerpt">Короткий опис</label>
          <input id="n-excerpt" type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Одне речення для анонсу" className="mt-1 w-full py-2.5 text-cream" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-cream" htmlFor="n-body">Текст</label>
          <textarea id="n-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-1 w-full rounded-[3px] border border-hair bg-transparent px-3 py-2.5 text-sm text-cream outline-none" />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="n-cat">Категорія</label>
            <select id="n-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 py-2.5 text-cream">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={busy === "create"} className="rounded-[3px] bg-cream px-4 py-2.5 text-sm font-semibold text-void hover:bg-white disabled:opacity-50">
            Створити чернетку
          </button>
        </div>
      </form>

      {error && <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-ink-lo">Завантаження…</p>
      ) : posts.length > 0 ? (
        <ul className="mt-8 max-w-2xl divide-y divide-hair border-y border-hair">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-cream">{p.title}</p>
                <p className="text-xs text-ink-lo">
                  {p.category} · {new Date(p.createdAt).toLocaleDateString("uk-UA")}
                  {p.author ? ` · ${p.author.displayName}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setStatus(p, p.status === "published" ? "draft" : "published")}
                  disabled={busy === p.id}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
                    p.status === "published" ? "bg-good/15 text-good" : "bg-warn/15 text-warn"
                  }`}
                >
                  {p.status === "published" ? "Опубліковано" : "Чернетка"}
                </button>
                <button onClick={() => remove(p)} disabled={busy === p.id} className="rounded border border-hair px-2 py-1 text-xs text-crimson-bright hover:border-crimson-bright disabled:opacity-50">
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="mt-8 text-sm text-ink-lo">Новин ще немає.</p>
      )}
    </div>
  );
}
