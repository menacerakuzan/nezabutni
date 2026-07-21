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

  return (
    <div className="flex items-center gap-3">
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
