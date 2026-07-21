"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { authFetch } from "../../../lib/auth-client";

const STEPS = ["Особа", "Служба", "Документи", "Медіа", "Згода"];

export default function NewSubmissionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [publishData, setPublishData] = useState(false);
  const [processPii, setProcessPii] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!publishData || !processPii) {
      setError("Потрібна згода на публікацію даних і обробку персональних даних.");
      return;
    }

    setSubmitting(true);
    const res = await authFetch("/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: { fullName, birthDate, deathDate, birthPlace },
        consent: { publishData, processPii, publishMedia: false },
      }),
    });
    setSubmitting(false);

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message || "Не вдалося подати заявку.");
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-6 pb-16 pt-28 text-ink-lo">Завантаження…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-cream">Подати інформацію</h1>
        <p className="mt-4 text-ink">
          Щоб подати заявку, потрібно увійти в акаунт.{" "}
          <Link href="/login" className="text-gold hover:text-gold-soft">
            Увійти
          </Link>{" "}
          або{" "}
          <Link href="/register" className="text-gold hover:text-gold-soft">
            зареєструватися
          </Link>
          .
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-cream">Заявку подано</h1>
        <p className="mt-4 text-ink">
          Дякуємо. Заявка потрапила в чергу верифікації. Статус можна відстежити в{" "}
          <Link href="/account" className="text-gold hover:text-gold-soft">
            особистому кабінеті
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <nav aria-label="Хлібні крихти" className="mb-4 text-sm text-ink-lo">
        <Link href="/" className="hover:text-cream">
          Головна
        </Link>{" "}
        / <span className="text-cream">Подати інформацію</span>
      </nav>
      <h1 className="font-display text-4xl font-semibold text-cream">
        Подати інформацію про захисника
      </h1>
      <p className="mt-4 text-ink">
        Дані потраплять у чергу верифікації відповідального органу
        (docs/prd/01-defenders-registry.md, п. 3.4).
      </p>

      <ol className="mt-6 flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-crimson text-cream" : "bg-white/[0.04] text-ink"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-lg border border-hair bg-white/[0.03] p-6">
        <div>
          <label className="block text-sm font-medium text-cream" htmlFor="fullName">
            ПІБ захисника
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full py-2.5 text-cream"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cream" htmlFor="birthDate">
              Дата народження
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 w-full py-2.5 text-cream"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cream" htmlFor="deathDate">
              Дата загибелі
            </label>
            <input
              id="deathDate"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              className="mt-1 w-full py-2.5 text-cream"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-cream" htmlFor="birthPlace">
            Місце народження
          </label>
          <input
            id="birthPlace"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            className="mt-1 w-full py-2.5 text-cream"
          />
        </div>

        <div className="space-y-2 rounded-md bg-white/[0.04] p-4">
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={publishData}
              onChange={(e) => setPublishData(e.target.checked)}
              className="mt-1"
            />
            Я даю згоду на публікацію цих даних на платформі
          </label>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={processPii}
              onChange={(e) => setProcessPii(e.target.checked)}
              className="mt-1"
            />
            Я даю згоду на обробку персональних даних
          </label>
        </div>

        {error && <p className="text-sm text-crimson-bright">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[3px] bg-crimson px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-crimson-bright disabled:opacity-60"
        >
          {submitting ? "Надсилаємо…" : "Подати заявку"}
        </button>
      </form>
    </div>
  );
}
