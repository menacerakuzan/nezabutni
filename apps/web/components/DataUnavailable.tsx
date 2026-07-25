/**
 * Чесний стан, коли реєстр недоступний.
 *
 * Ми свідомо НЕ показуємо демонстраційні імена замість справжніх:
 * на меморіалі вигадане ім’я, подане як реальне, — це неправда про людину.
 * Краще визнати технічну проблему, ніж підмінити пам’ять.
 */
export function DataUnavailable({
  title = "Реєстр тимчасово недоступний",
  hint = "Це технічна несправність з нашого боку, а не втрата даних. Спробуйте оновити сторінку за кілька хвилин.",
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div className="mx-auto max-w-xl border-l-2 border-gold/50 py-10 pl-6">
      <p className="caption">Дані не завантажились</p>
      <h2 className="mt-3 font-display text-2xl font-semibold text-cream">{title}</h2>
      <p className="mt-3 leading-relaxed text-ink">{hint}</p>
    </div>
  );
}
