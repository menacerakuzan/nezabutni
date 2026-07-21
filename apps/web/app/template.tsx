/**
 * Шаблон маршруту: перемонтовується на кожну навігацію —
 * дає м’який в’їзд сторінки (анімація вимкнена під prefers-reduced-motion).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
