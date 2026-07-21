"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { authFetch } from "../../lib/auth-client";

interface QueueItem {
  id: string;
  entity_type: string;
  preview: string;
  submitted_by: string;
  created_at: string;
}

export default function ModerationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canModerate =
    user?.roles.includes("moderator") || user?.roles.includes("admin") || user?.roles.includes("superadmin");

  async function loadQueue() {
    const res = await authFetch("/moderation/queue");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    } else if (res.status === 403) {
      setError("Немає доступу до черги модерації.");
    }
  }

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) loadQueue();
  }, [user]);

  async function decide(id: string, decision: "approve" | "reject") {
    setBusy(id);
    await authFetch(`/moderation/queue/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await loadQueue();
    setBusy(null);
  }

  if (loading || !user) {
    return <div className="mx-auto max-w-3xl px-6 pb-16 pt-28 text-ink-lo">Завантаження…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-cream">Черга модерації</h1>
      <p className="mt-2 text-ink">
        Спогади та заявки, що очікують рішення — docs/prd/05-cms-moderation.md.
      </p>

      {error && <p className="mt-6 rounded-lg border border-crimson-bright bg-white/[0.03] p-4 text-crimson-bright">{error}</p>}

      {!error && items.length === 0 && (
        <p className="mt-8 rounded-lg border border-hair bg-white/[0.03] p-6 text-ink">Черга порожня.</p>
      )}

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-hair bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs uppercase text-ink">
                {item.entity_type === "memory_ugc" ? "Спогад" : "Заявка на профіль"}
              </span>
              <span className="text-xs text-ink-lo">
                {new Date(item.created_at).toLocaleString("uk-UA")}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink">{item.preview}</p>
            <p className="mt-1 text-xs text-ink-lo">Подав: {item.submitted_by}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => decide(item.id, "approve")}
                disabled={busy === item.id}
                className="rounded-md border border-good px-3 py-1.5 text-sm font-medium text-good transition-colors hover:bg-good/15 disabled:opacity-60"
              >
                Схвалити
              </button>
              <button
                onClick={() => decide(item.id, "reject")}
                disabled={busy === item.id}
                className="rounded-[3px] bg-crimson px-3 py-1.5 text-sm font-medium text-cream transition-colors hover:bg-crimson-bright disabled:opacity-60"
              >
                Відхилити
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
