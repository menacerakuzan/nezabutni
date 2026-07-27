import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { fetchMenu } from "../lib/api";

/**
 * Резервні колонки — лише якщо CMS недоступна. Основне джерело: таблиця
 * menu_item, локації footer_memorial / footer_platform / footer_join
 * (редагується в /admin/menu, як і хедер).
 */
const COLUMNS_FALLBACK: { title: string; location: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Меморіал",
    location: "footer_memorial",
    links: [
      { href: "/defenders", label: "Реєстр імен" },
      { href: "/map", label: "Карта пам’яті" },
      { href: "/museum", label: "Онлайн-музей" },
      { href: "/stories", label: "Тексти пам’яті" },
    ],
  },
  {
    title: "Платформа",
    location: "footer_platform",
    links: [
      { href: "/about", label: "Про проєкт" },
      { href: "/partners", label: "Партнери" },
      { href: "/accessibility", label: "Доступність" },
      { href: "/contacts", label: "Контакти" },
    ],
  },
  {
    title: "Долучитися",
    location: "footer_join",
    links: [
      { href: "/submissions/new", label: "Подати ім’я" },
      { href: "/donate", label: "Підтримати" },
      { href: "/register", label: "Створити акаунт" },
    ],
  },
];

export async function Footer() {
  const menu = await fetchMenu();

  const columns = COLUMNS_FALLBACK.map((col) => ({
    title: col.title,
    links: menu.ok && menu.data[col.location]?.length ? menu.data[col.location]! : col.links,
  }));

  return (
    <footer className="relative border-t border-hair bg-navy-950">
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-20">
        {/* Велике тихе висловлювання */}
        <p className="max-w-3xl font-display text-3xl font-medium leading-tight text-cream md:text-4xl">
          Поки пам’ятаємо — вони з нами.
        </p>

        <div className="mt-16 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-auto text-gold" />
              <span className="font-display text-lg font-semibold text-cream">Незабутні</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-ink-lo">
              Цифровий меморіал і музей пам’яті захисників регіону.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[11px] uppercase text-ink-faint">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink transition-colors hover:text-cream"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-hair pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Незабутні · Вічна пам’ять захисникам</span>
          <span>Регіональна платформа цифрової пам’яті</span>
        </div>
      </div>
    </footer>
  );
}
