import Link from "next/link";
import { AuthStatus } from "./AuthStatus";
import { LogoMark } from "./LogoMark";
import { ButtonLink } from "./ui/Button";
import { fetchMenu } from "../lib/api";

/**
 * Резервна навігація: якщо CMS недоступна, користувач усе одно має
 * дістатися до розділів. Основне джерело — таблиця menu_item.
 */
const NAV_FALLBACK = [
  { href: "/defenders", label: "Реєстр" },
  { href: "/map", label: "Карта" },
  { href: "/museum", label: "Музей" },
  { href: "/stories", label: "Тексти" },
  { href: "/about", label: "Про нас" },
];

export async function Header() {
  const menu = await fetchMenu();
  const NAV = menu.ok && menu.data.header?.length ? menu.data.header : NAV_FALLBACK;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* легке затемнення зверху для читабельності поверх медіа */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/80 to-transparent" />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-6 w-auto text-gold" />
          <span className="font-display text-base font-semibold tracking-wide text-cream">
            Незабутні
          </span>
        </Link>

        <nav aria-label="Основна навігація" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] text-ink transition-colors hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/search"
            aria-label="Пошук"
            className="hidden text-ink transition-colors hover:text-cream sm:block"
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12.5 12.5 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
          <AuthStatus />
          <ButtonLink href="/submissions/new" variant="solid" className="hidden !px-4 !py-2 sm:inline-flex">
            Подати ім’я
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
