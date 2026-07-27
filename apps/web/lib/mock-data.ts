/**
 * Лише утиліта форматування дат. Демонстраційні записи захисників
 * (MOCK_DEFENDERS) видалено — увесь контент іде з БД через GET /defenders;
 * недоступність реєстру показується чесним станом помилки, а не
 * підміняється вигаданими іменами.
 */
export function formatDates(birth: string | null, death: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
  if (birth && death) return `${fmt(birth)} — ${fmt(death)}`;
  if (death) return fmt(death);
  if (birth) return fmt(birth);
  return "";
}
