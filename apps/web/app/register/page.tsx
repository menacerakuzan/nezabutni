"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "../../lib/auth-client";
import { useAuth } from "../../components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, displayName);
      await refresh();
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-16 pt-28">
      <h1 className="font-display text-3xl font-semibold text-cream">Реєстрація</h1>
      <p className="mt-2 text-sm text-ink-lo">
        Створіть акаунт, щоб подавати заявки на профілі захисників і залишати спогади.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 border-t border-hair pt-8">
        <div>
          <label className="block text-sm font-medium text-cream" htmlFor="displayName">
            Ім’я
          </label>
          <input
            id="displayName"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full py-2.5 text-cream"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cream" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full py-2.5 text-cream"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cream" htmlFor="password">
            Пароль (мінімум 8 символів)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full py-2.5 text-cream"
          />
        </div>
        {error && <p className="text-sm text-crimson-bright">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[3px] bg-crimson px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-crimson-bright disabled:opacity-60"
        >
          {loading ? "Реєструємо…" : "Зареєструватися"}
        </button>
        <p className="text-center text-sm text-ink-lo">
          Вже є акаунт? <Link href="/login" className="text-gold hover:text-gold-soft">Увійти</Link>
        </p>
      </form>
    </div>
  );
}
