"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { authFetch } from "../../lib/auth-client";
import { StatusBadge } from "../../components/StatusBadge";

interface Submission {
  id: string;
  status: string;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
}

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    authFetch("/submissions/mine")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSubmissions)
      .finally(() => setLoadingSubs(false));
  }, [user]);

  if (loading || !user) {
    return <div className="mx-auto max-w-3xl px-6 pb-16 pt-28 text-ink-lo">Завантаження…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-cream">Мій кабінет</h1>
      <p className="mt-2 text-ink">
        {user.displayName} · {user.email} · ролі: {user.roles.join(", ")}
      </p>

      <h2 className="mt-10 font-display text-xl font-semibold text-cream">Мої заявки</h2>
      {loadingSubs ? (
        <p className="mt-3 text-sm text-ink-lo">Завантаження…</p>
      ) : submissions.length === 0 ? (
        <div className="mt-4 rounded-lg border border-hair bg-white/[0.03] p-6">
          <p className="text-ink">Ви ще не подавали заявок.</p>
          <Link href="/submissions/new" className="mt-2 inline-block text-sm text-gold hover:text-gold-soft">
            Подати інформацію про захисника →
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-lg border border-hair bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={s.status} />
                <span className="text-xs text-ink-lo">
                  {new Date(s.createdAt).toLocaleDateString("uk-UA")}
                </span>
              </div>
              {s.decisionNote && <p className="mt-1 text-sm text-ink">{s.decisionNote}</p>}
            </li>
          ))}
        </ul>
      )}

      {(user.roles.includes("moderator") || user.roles.includes("superadmin") || user.roles.includes("admin")) && (
        <div className="mt-10 rounded-lg border border-hair bg-white/[0.04] p-4">
          <Link href="/moderation" className="text-sm font-medium text-gold hover:text-gold-soft">
            Перейти до черги модерації →
          </Link>
        </div>
      )}
    </div>
  );
}
