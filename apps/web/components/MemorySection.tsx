"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { authFetch } from "../lib/auth-client";

interface Memory {
  id: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
}

export function MemorySection({ pid }: { pid: string }) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    fetch(`${apiUrl}/defenders/${pid}/memories`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setMemories(d.items ?? []))
      .finally(() => setLoaded(true));
  }, [pid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    const res = await authFetch(`/defenders/${pid}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSent(true);
      setBody("");
    }
  }

  return (
    <section className="mt-16 border-t border-hair pt-10">
      <h2 className="text-[11px] uppercase text-gold-soft">Спогади</h2>

      {loaded && memories.length === 0 && (
        <p className="mt-5 max-w-prose text-ink-lo">Поки що немає жодного спогаду.</p>
      )}

      <ul className="mt-5 space-y-3">
        {memories.map((m) => (
          <li key={m.id} className="rounded-xl border border-hair bg-white/[0.03] p-5">
            <p className="text-ink">{m.body}</p>
            <p className="mt-3 text-xs text-ink-faint">
              {m.authorDisplayName} · {new Date(m.createdAt).toLocaleDateString("uk-UA")}
            </p>
          </li>
        ))}
      </ul>

      {sent ? (
        <p className="mt-5 rounded-xl border border-gold/20 bg-gold/[0.06] p-4 text-sm text-gold-soft">
          Дякуємо. Спогад надіслано на модерацію і з’явиться після перевірки.
        </p>
      ) : user ? (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Поділіться спогадом про цю людину…"
            rows={3}
            minLength={10}
            required
            className="w-full rounded-[3px] border border-hair bg-white/[0.03] px-4 py-3 text-cream placeholder:text-ink-faint focus:border-hair-strong focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-crimson px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-crimson-bright disabled:opacity-60"
          >
            {submitting ? "Надсилаємо…" : "Додати спогад"}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-ink-lo">
          <Link href="/login" className="text-gold transition-colors hover:text-gold-soft">
            Увійдіть
          </Link>
          , щоб залишити спогад.
        </p>
      )}
    </section>
  );
}
