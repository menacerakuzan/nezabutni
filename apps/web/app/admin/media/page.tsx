"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth-client";
import { FileUpload, type UploadedMedia } from "../../../components/FileUpload";
import { StatusBadge } from "../../../components/StatusBadge";

interface AdminMediaItem {
  id: string;
  kind: string;
  title: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  status: string;
  url: string;
  createdAt: string;
  uploadedBy: { displayName: string; email: string | null } | null;
}

interface AdminMediaPage {
  items: AdminMediaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const KINDS = ["photo", "video", "audio", "document", "document_3d", "panorama"];
const STATUSES = ["draft", "in_review", "published", "archived"];

const KIND_LABEL: Record<string, string> = {
  photo: "Фото",
  video: "Відео",
  audio: "Аудіо",
  document: "Документ",
  document_3d: "3D-модель",
  panorama: "Панорама",
};

function formatBytes(n: number | null): string {
  if (n === null) return "—";
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} КБ`;
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function AdminMediaPage() {
  const [data, setData] = useState<AdminMediaPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ page: String(page), pageSize: "24" });
    if (kind) qs.set("kind", kind);
    if (status) qs.set("status", status);
    if (q.trim()) qs.set("q", q.trim());

    try {
      const res = await authFetch(`/media/admin?${qs.toString()}`);
      if (res.status === 403) {
        setError("Медіатека доступна модераторам і адміністраторам.");
        setData(null);
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити медіатеку.");
        setData(null);
        return;
      }
      setData(await res.json());
    } catch {
      setError("Немає зв’язку із сервером.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [kind, status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Скидаємо на першу сторінку при зміні фільтрів
  useEffect(() => {
    setPage(1);
  }, [kind, status, q]);

  async function changeStatus(id: string, next: string) {
    setBusyId(id);
    const res = await authFetch(`/media/admin/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusyId(null);
    if (res.ok) load();
  }

  async function remove(id: string, title: string | null) {
    if (!confirm(`Видалити файл «${title ?? id}»? Дію не можна скасувати.`)) return;
    setBusyId(id);
    const res = await authFetch(`/media/admin/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      load();
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.message ?? "Не вдалося видалити файл.");
    }
  }

  function onUploaded(items: UploadedMedia[]) {
    if (items.length > 0) {
      setShowUpload(false);
      load();
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Медіатека</h1>
          <p className="mt-1 text-sm text-ink-lo">
            {data ? `${data.total} файлів у сховищі` : "Завантаження…"}
          </p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white"
        >
          {showUpload ? "Закрити" : "+ Завантажити"}
        </button>
      </header>

      {showUpload && (
        <div className="mt-4 border border-hair p-5">
          <FileUpload onChange={onUploaded} />
        </div>
      )}

      {/* Фільтри */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук за назвою…"
          className="w-56 py-2 text-sm text-cream"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="border-b border-hair-strong bg-transparent py-2 text-sm text-cream"
        >
          <option value="">Усі типи</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k] ?? k}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border-b border-hair-strong bg-transparent py-2 text-sm text-cream"
        >
          <option value="">Усі статуси</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>
      )}

      {!error && loading && <p className="mt-8 text-sm text-ink-lo">Завантаження…</p>}

      {!error && !loading && data && data.items.length === 0 && (
        <p className="mt-8 text-sm text-ink-lo">Файлів за цим фільтром не знайдено.</p>
      )}

      {!error && data && data.items.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {data.items.map((a) => (
              <figure
                key={a.id}
                className="overflow-hidden rounded-[4px] border border-hair bg-white/[0.02]"
              >
                {a.kind === "photo" ? (
                  <img
                    src={`${API_URL}${a.url.replace("/api/v1", "")}`}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover [filter:saturate(0.7)_brightness(0.9)]"
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-white/[0.03] text-3xl text-ink-faint">
                    {a.kind === "document" ? "📄" : a.kind === "video" ? "🎬" : a.kind === "audio" ? "🎵" : "🗂"}
                  </div>
                )}
                <figcaption className="p-3">
                  <p className="truncate text-xs font-medium text-cream" title={a.title ?? ""}>
                    {a.title ?? "Без назви"}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-lo">
                    {KIND_LABEL[a.kind] ?? a.kind} · {formatBytes(a.sizeBytes)}
                  </p>
                  {a.uploadedBy && (
                    <p className="mt-0.5 truncate text-[11px] text-ink-faint">{a.uploadedBy.displayName}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StatusBadge status={a.status} />
                    <select
                      value={a.status}
                      disabled={busyId === a.id}
                      onChange={(e) => changeStatus(a.id, e.target.value)}
                      aria-label={`Статус: ${a.title}`}
                      className="border-0 border-b border-hair bg-transparent py-0.5 text-[11px] text-ink"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => remove(a.id, a.title)}
                    disabled={busyId === a.id}
                    className="mt-2 text-[11px] text-ink-faint transition-colors hover:text-crimson-bright disabled:opacity-50"
                  >
                    Видалити
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center gap-3 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-hair px-3 py-1.5 text-ink hover:text-cream disabled:opacity-30"
              >
                ← Назад
              </button>
              <span className="text-ink-lo">
                {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="rounded border border-hair px-3 py-1.5 text-ink hover:text-cream disabled:opacity-30"
              >
                Далі →
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-ink-lo">
        Кожен файл проходить перевірку справжнього типу за вмістом (не за розширенням) і
        дедуплікується за контрольною сумою. Публікація на сайті — після статусу «published».
      </p>
    </div>
  );
}
