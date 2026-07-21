"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../../lib/auth-client";
import { useAuth } from "../../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      await refresh();
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка входу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-16 pt-28">
      <h1 className="font-display text-3xl font-semibold text-cream">Увійти</h1>
      <p className="mt-2 text-sm text-ink-lo">
        Демо-версія використовує звичайний email/пароль. У production —
        BankID/Дія.Підпис (Master Plan, розділ 16 Security).
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 border-t border-hair pt-8">
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
            Пароль
          </label>
          <input
            id="password"
            type="password"
            required
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
          {loading ? "Входимо…" : "Увійти"}
        </button>
        <p className="text-center text-sm text-ink-lo">
          Немає акаунта? <Link href="/register" className="text-gold hover:text-gold-soft">Зареєструватися</Link>
        </p>
        <div className="border-l-2 border-gold/40 pl-3 py-1 text-xs text-ink">
          Демо-акаунт адміністратора: admin@memorial.dev / admin12345
        </div>
      </form>
    </div>
  );
}
