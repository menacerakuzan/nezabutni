"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

interface AuditRow {
  id: string;
  actor: { displayName: string; email: string | null } | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  diff: unknown;
  createdAt: string;
}

interface AuditResponse {
  items: AuditRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ACTION_LABEL: Record<string, string> = {
  "defender.delete": "Видалено захисника",
  "menu.create": "Додано пункт меню",
  "menu.update": "Змінено пункт меню",
  "menu.delete": "Видалено пункт меню",
  "block.update": "Змінено блок сторінки",
};

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/audit?page=${p}&pageSize=30`);
      if (res.status === 403) {
        setError("Розділ доступний лише адміністраторам.");
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити журнал змін.");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Немає зв’язку із сервером.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Журнал змін</h1>
      <p className="mt-1 text-sm text-ink-lo">Хто, коли і що змінив у контенті платформи</p>

      {error && <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>}

      {!error && (
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-hair">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-hair text-[11px] uppercase text-ink-lo">
                <th className="px-4 py-3 font-semibold">Час</th>
                <th className="px-4 py-3 font-semibold">Користувач</th>
                <th className="px-4 py-3 font-semibold">Дія</th>
                <th className="px-4 py-3 font-semibold">Об’єкт</th>
                <th className="px-4 py-3 font-semibold">Деталі</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-ink-lo">Завантаження…</td></tr>
              ) : !data?.items.length ? (
                <tr><td colSpan={5} className="px-4 py-6 text-ink-lo">Подій поки немає.</td></tr>
              ) : (
                data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 text-ink">{new Date(r.createdAt).toLocaleString("uk-UA")}</td>
                    <td className="px-4 py-3 text-cream">{r.actor?.displayName ?? "—"}</td>
                    <td className="px-4 py-3 text-ink">{ACTION_LABEL[r.action] ?? r.action}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-lo">
                      {r.entityType ?? "—"}
                      {r.entityId ? `:${r.entityId.slice(0, 8)}` : ""}
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-3 font-mono text-[11px] text-ink-faint" title={r.diff ? JSON.stringify(r.diff) : ""}>
                      {r.diff ? JSON.stringify(r.diff) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-xs text-ink-lo">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border border-hair px-2 py-1 text-ink hover:text-cream disabled:opacity-30"
          >
            ← Назад
          </button>
          <span>Сторінка {data.page} з {data.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="rounded border border-hair px-2 py-1 text-ink hover:text-cream disabled:opacity-30"
          >
            Далі →
          </button>
        </div>
      )}
    </div>
  );
}
