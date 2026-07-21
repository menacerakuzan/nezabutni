"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../../lib/auth-client";

interface Stats {
  total: number;
  verified: number;
  pending: number;
  places: number;
  units: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<number | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API}/stats`)
      .then((r) => (setApiOk(r.ok), r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setApiOk(false));
    authFetch("/moderation/queue")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setQueue(d?.items?.length ?? null))
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Імен у меморіалі", value: stats?.total, href: "/admin/people" },
    { label: "Верифіковано", value: stats?.verified, href: "/admin/people" },
    { label: "Очікують модерації", value: queue ?? stats?.pending, href: "/admin/moderation", warn: true },
    { label: "Місць на карті", value: stats?.places, href: "/admin/places" },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Дашборд</h1>
          <p className="mt-1 text-sm text-ink-lo">Стан платформи й останні події</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              apiOk === null ? "bg-ink-faint" : apiOk ? "bg-good" : "bg-crimson-bright"
            }`}
          />
          <span className="text-ink">
            API {apiOk === null ? "перевірка…" : apiOk ? "працює" : "недоступний"}
          </span>
        </div>
      </header>

      {/* Метрики */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-[4px] border p-5 transition-colors hover:border-hair-strong ${
              c.warn && (c.value ?? 0) > 0 ? "border-gold/50 bg-gold/[0.06]" : "border-hair bg-white/[0.02]"
            }`}
          >
            <p className="text-sm text-ink-lo">{c.label}</p>
            <p className="mt-2 font-display text-4xl font-bold text-cream">{c.value ?? "—"}</p>
          </Link>
        ))}
      </div>

      {/* Швидкі дії */}
      <section className="mt-10">
        <h2 className="caption">Швидкі дії</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/moderation" className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white">
            Перейти до модерації
          </Link>
          <Link href="/admin/places" className="rounded-[3px] border border-hair-strong px-4 py-2 text-sm font-medium text-cream hover:border-cream">
            Додати місце на карту
          </Link>
          <Link href="/" className="rounded-[3px] border border-hair px-4 py-2 text-sm font-medium text-ink hover:border-cream hover:text-cream">
            Відкрити сайт ↗
          </Link>
        </div>
      </section>

      {/* Стан системи */}
      <section className="mt-10 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[4px] border border-hair p-5">
          <h2 className="caption">Стан системи</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex justify-between"><span className="text-ink">API-сервер</span><span className={apiOk ? "text-good" : "text-crimson-bright"}>{apiOk ? "онлайн" : "офлайн"}</span></li>
            <li className="flex justify-between"><span className="text-ink">База даних (PostGIS)</span><span className={apiOk ? "text-good" : "text-ink-faint"}>{apiOk ? "онлайн" : "—"}</span></li>
            <li className="flex justify-between"><span className="text-ink">Резервні копії</span><span className="text-ink-faint">етап впровадження</span></li>
            <li className="flex justify-between"><span className="text-ink">Моніторинг помилок</span><span className="text-ink-faint">етап впровадження</span></li>
          </ul>
        </div>
        <div className="rounded-[4px] border border-hair p-5">
          <h2 className="caption">Останні події</h2>
          <p className="mt-4 text-sm text-ink">
            Журнал подій підключається до Audit Log API (наступний етап). Зараз рішення модерації
            фіксуються у базі — перегляд у розділі{" "}
            <Link href="/admin/audit" className="text-gold hover:text-gold-soft">Журнал змін</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
