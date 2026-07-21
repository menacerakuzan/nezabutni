"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/auth-client";

interface Row { when: string; who: string; what: string; entity: string }

export default function AdminAuditPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    // Поки що показуємо рішення модерації як події журналу
    authFetch("/moderation/queue")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) =>
        setRows(
          (d.items ?? []).map((i: { created_at: string; submitted_by: string; entity_type: string; preview: string }) => ({
            when: new Date(i.created_at).toLocaleString("uk-UA"),
            who: i.submitted_by,
            what: "Подано на модерацію",
            entity: i.entity_type === "memory_ugc" ? "Спогад" : "Заявка на профіль",
          }))
        )
      )
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Журнал змін</h1>
      <p className="mt-1 text-sm text-ink-lo">Хто, коли і що змінив — з можливістю відкату (етап 2)</p>

      <div className="mt-6 overflow-x-auto rounded-[4px] border border-hair">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-hair text-[11px] uppercase text-ink-lo">
              <th className="px-4 py-3 font-semibold">Час</th>
              <th className="px-4 py-3 font-semibold">Користувач</th>
              <th className="px-4 py-3 font-semibold">Дія</th>
              <th className="px-4 py-3 font-semibold">Об’єкт</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-ink-lo">Подій поки немає — черга модерації порожня.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-ink">{r.when}</td>
                  <td className="px-4 py-3 text-cream">{r.who}</td>
                  <td className="px-4 py-3 text-ink">{r.what}</td>
                  <td className="px-4 py-3 text-ink">{r.entity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-lo">
        Повний Audit Log (усі сутності, до/після, відкат версій) підключається до окремої таблиці
        audit_log — схема вже описана в проєктній документації.
      </p>
    </div>
  );
}
