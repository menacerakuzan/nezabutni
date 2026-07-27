"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function AuthStatus() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <span className="w-8 text-sm text-ink-faint">·</span>;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-[13px] text-ink transition-colors hover:text-cream"
      >
        Увійти
      </Link>
    );
  }

  const canModerate =
    user.roles.includes("moderator") ||
    user.roles.includes("admin") ||
    user.roles.includes("superadmin");

  return (
    <div className="flex items-center gap-3">
      {canModerate && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-[12px] text-gold-soft transition-colors hover:border-gold hover:text-gold"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Адмін-панель
        </Link>
      )}
      <Link
        href="/account"
        className="text-[13px] text-ink transition-colors hover:text-cream"
      >
        {user.displayName.split(" ")[0]}
      </Link>
      <button
        onClick={logout}
        aria-label="Вийти"
        className="text-[13px] text-ink-faint transition-colors hover:text-cream"
      >
        ✕
      </button>
    </div>
  );
}
