"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";

/**
 * Адмін-оболонка «Незабутні CMS»: бокова навігація + захист за ролями.
 * Публічна частина — музей; тут — робоче місце редакторів і модераторів.
 */

const SECTIONS: { title: string; items: { href: string; label: string; live?: boolean }[] }[] = [
  {
    title: "Огляд",
    items: [{ href: "/admin", label: "Дашборд", live: true }],
  },
  {
    title: "Контент",
    items: [
      { href: "/admin/people", label: "Меморіал", live: true },
      { href: "/admin/moderation", label: "Модерація", live: true },
      { href: "/admin/places", label: "Місця на карті", live: true },
      { href: "/admin/media", label: "Медіатека", live: true },
      { href: "/admin/news", label: "Новини", live: true },
    ],
  },
  {
    title: "Сайт",
    items: [
      { href: "/admin/pages", label: "Сторінки", live: true },
      { href: "/admin/menu", label: "Меню", live: true },
    ],
  },
  {
    title: "Система",
    items: [
      { href: "/admin/users", label: "Користувачі", live: true },
      { href: "/admin/settings", label: "Налаштування", live: true },
      { href: "/admin/audit", label: "Журнал змін", live: true },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed =
    user?.roles.includes("moderator") ||
    user?.roles.includes("admin") ||
    user?.roles.includes("superadmin");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="px-6 pt-32 text-ink-lo">Завантаження…</div>;
  }
  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl px-6 pt-32">
        <h1 className="font-display text-3xl font-semibold text-cream">Немає доступу</h1>
        <p className="mt-3 text-ink">
          Адмін-панель доступна модераторам і адміністраторам. Ваші ролі: {user.roles.join(", ")}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] gap-0 px-4 pb-16 pt-24 md:px-6">
      {/* Бокова навігація */}
      <aside className="sticky top-24 hidden h-[calc(100dvh-8rem)] w-56 flex-none overflow-y-auto border-r border-hair pr-4 lg:block">
        <p className="caption">Незабутні CMS</p>
        {SECTIONS.map((s) => (
          <div key={s.title} className="mt-6">
            <p className="text-[11px] font-semibold uppercase text-ink-faint">{s.title}</p>
            <ul className="mt-2 space-y-0.5">
              {s.items.map((it) => {
                const active =
                  it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={`flex items-center justify-between rounded-[3px] px-2.5 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-white/[0.06] font-semibold text-cream"
                          : "text-ink hover:bg-white/[0.03] hover:text-cream"
                      }`}
                    >
                      {it.label}
                      {!it.live && (
                        <span className="text-[10px] uppercase text-ink-faint">каркас</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="mt-8 border-t border-hair pt-4 text-xs text-ink-lo">
          {user.displayName}
          <br />
          {user.roles.join(" · ")}
        </div>
      </aside>

      {/* Контент */}
      <main className="min-w-0 flex-1 lg:pl-8">{children}</main>
    </div>
  );
}
