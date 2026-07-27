"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DefenderSummary } from "../../../lib/types";
import { formatDates } from "../../../lib/mock-data";
import { authFetch } from "../../../lib/auth-client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function AdminPeoplePage() {
  const [items, setItems] = useState<DefenderSummary[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);
  const [busyPid, setBusyPid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`${API}/defenders`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => items.filter((d) => d.fullName.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q]
  );

  async function remove(pid: string, fullName: string) {
    if (!confirm(`Видалити «${fullName}» з реєстру? Сторінку пам’яті, свічки й спогади буде втрачено. Дію не можна скасувати.`)) {
      return;
    }
    setActionError(null);
    setBusyPid(pid);
    const res = await authFetch(`/defenders/${pid}`, { method: "DELETE" });
    setBusyPid(null);
    if (res.ok) {
      setItems((prev) => prev.filter((d) => d.pid !== pid));
    } else if (res.status === 403) {
      setActionError("Видалення доступне лише адміністраторам.");
    } else {
      const body = await res.json().catch(() => null);
      setActionError(body?.message ?? "Не вдалося видалити запис.");
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Меморіал</h1>
          <p className="mt-1 text-sm text-ink-lo">{items.length} записів у реєстрі</p>
        </div>
        <Link
          href="/submissions/new"
          className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white"
        >
          + Нова заявка
        </Link>
      </header>

      {error && (
        <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">
          Реєстр недоступний — перевірте, чи запущений API.
        </p>
      )}
      {actionError && (
        <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{actionError}</p>
      )}

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Пошук за ім’ям…"
        className="mt-6 w-full max-w-md py-2.5 text-cream"
      />

      <div className="mt-6 overflow-x-auto rounded-[4px] border border-hair">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-hair text-[11px] uppercase text-ink-lo">
              <th className="px-4 py-3 font-semibold">Ім’я</th>
              <th className="px-4 py-3 font-semibold">Роки</th>
              <th className="px-4 py-3 font-semibold">Підрозділ</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {filtered.map((d) => (
              <tr key={d.pid} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-semibold text-cream">{d.fullName}</td>
                <td className="px-4 py-3 text-ink">{formatDates(d.birthDate, d.deathDate)}</td>
                <td className="px-4 py-3 text-ink">{d.unitName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.verificationStatus === "verified"
                        ? "bg-good/15 text-good"
                        : "bg-warn/15 text-warn"
                    }`}
                  >
                    {d.verificationStatus === "verified" ? "Верифіковано" : "На перевірці"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <Link href={`/defenders/${d.pid}`} className="text-gold hover:text-gold-soft">
                      Відкрити ↗
                    </Link>
                    <button
                      onClick={() => remove(d.pid, d.fullName)}
                      disabled={busyPid === d.pid}
                      className="text-ink-faint transition-colors hover:text-crimson-bright disabled:opacity-50"
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-lo">
        Зміни до записів вносяться через заявки родин і чергу модерації — так кожна правка має
        джерело й автора. Видалення доступне адміністраторам і фіксується в журналі змін.
      </p>
    </div>
  );
}
