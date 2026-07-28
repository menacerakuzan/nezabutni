"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { authFetch } from "../../../lib/auth-client";

interface UserRow {
  id: string;
  email: string | null;
  displayName: string;
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  roles: string[];
}

/** Проста дворівнева модель: «Адміністратор» (повний доступ до /admin) або звичайний користувач. */
const isAdmin = (roles: string[]) => roles.includes("admin") || roles.includes("superadmin");

export default function AdminUsersPage() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/admin/users");
      if (res.status === 403) {
        setError("Розділ доступний лише адміністраторам.");
        return;
      }
      if (!res.ok) {
        setError("Не вдалося завантажити користувачів.");
        return;
      }
      setUsers(await res.json());
    } catch {
      setError("Немає зв’язку із сервером.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(u: UserRow) {
    const nextStatus = u.status === "active" ? "suspended" : "active";
    setBusy(u.id);
    const res = await authFetch(`/admin/users/${u.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(null);
    if (res.ok) setUsers(users.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x)));
    else setError("Не вдалося змінити статус.");
  }

  async function toggleAdmin(u: UserRow) {
    const has = u.roles.includes("admin");
    setBusy(u.id);
    const res = await authFetch(`/admin/users/${u.id}/roles${has ? "/admin" : ""}`, {
      method: has ? "DELETE" : "POST",
      headers: has ? undefined : { "Content-Type": "application/json" },
      body: has ? undefined : JSON.stringify({ role: "admin" }),
    });
    setBusy(null);
    if (res.ok) {
      setUsers(
        users.map((x) =>
          x.id === u.id ? { ...x, roles: has ? x.roles.filter((r) => r !== "admin") : [...x.roles, "admin"] } : x
        )
      );
    } else {
      setError("Не вдалося змінити роль.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Користувачі</h1>
      <p className="mt-1 text-sm text-ink-lo">Хто має доступ до адмін-панелі, хто заблокований</p>

      {error && <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{error}</p>}

      {!error && (
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-hair">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-hair text-[11px] uppercase text-ink-lo">
                <th className="px-4 py-3 font-semibold">Користувач</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3 font-semibold">Адміністратор</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-6 text-ink-lo">Завантаження…</td></tr>
              ) : !users.length ? (
                <tr><td colSpan={3} className="px-4 py-6 text-ink-lo">Користувачів немає.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-cream">{u.displayName}</p>
                      <p className="text-xs text-ink-lo">{u.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={busy === u.id || u.id === me?.id}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-40 ${
                          u.status === "active" ? "bg-good/15 text-good" : "bg-crimson-bright/15 text-crimson-bright"
                        }`}
                        title={u.id === me?.id ? "Не можна заблокувати власний акаунт" : undefined}
                      >
                        {u.status === "active" ? "активний" : "заблокований"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAdmin(u)}
                        disabled={busy === u.id || u.roles.includes("superadmin")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          isAdmin(u.roles) ? "bg-white/[0.12] text-cream" : "border border-hair text-ink-faint hover:border-hair-strong"
                        }`}
                        title={u.roles.includes("superadmin") ? "Засновник платформи — статус незмінний" : undefined}
                      >
                        {u.roles.includes("superadmin") ? "Засновник" : isAdmin(u.roles) ? "Так" : "Ні"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
