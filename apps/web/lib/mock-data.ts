import type { DefenderSummary } from "./types";

// Демонстраційні дані для розробки UI. Вигадані ПІБ — не реальні особи.
// У production ці дані приходять з GET /defenders (docs/api/openapi.yaml).
export const MOCK_DEFENDERS: DefenderSummary[] = [
  {
    pid: "MEM-2026-000101",
    fullName: "Іваненко Олег Петрович",
    callsign: "Беркут",
    birthDate: "1989-04-12",
    deathDate: "2024-01-28",
    unitName: "128-ма окрема гірсько-штурмова бригада",
    regionName: "Одеська область",
    portraitUrl: null,
    excerpt:
      "Народився в Одесі, до війни працював інженером. Пішов добровольцем у перші дні повномасштабного вторгнення.",
    verificationStatus: "verified",
  },
  {
    pid: "MEM-2026-000102",
    fullName: "Ковальчук Андрій Миколайович",
    callsign: null,
    birthDate: "1995-09-03",
    deathDate: "2023-11-14",
    unitName: "28-ма окрема механізована бригада",
    regionName: "Одеська область",
    portraitUrl: null,
    excerpt:
      "Закінчив Одеську політехніку. Захищав Бахмутський напрямок у складі механізованого підрозділу.",
    verificationStatus: "verified",
  },
  {
    pid: "MEM-2026-000103",
    fullName: "Мельник Тарас Ігорович",
    callsign: "Сокіл",
    birthDate: "1992-02-20",
    deathDate: "2024-06-07",
    unitName: "126-та окрема бригада територіальної оборони",
    regionName: "Одеська область",
    portraitUrl: null,
    excerpt:
      "Вчитель фізики за освітою. Загинув, прикриваючи відхід побратимів під Роботиним.",
    verificationStatus: "pending",
  },
  {
    pid: "MEM-2026-000104",
    fullName: "Бондаренко Сергій Валерійович",
    callsign: "Хмара",
    birthDate: "1987-12-01",
    deathDate: "2023-08-22",
    unitName: "73-й морський центр спеціальних операцій",
    regionName: "Одеська область",
    portraitUrl: null,
    excerpt:
      "Кадровий військовослужбовець, служив з 2014 року. Нагороджений орденом «За мужність» III ступеня.",
    verificationStatus: "verified",
  },
];

export function getDefenderByPid(pid: string): DefenderSummary | undefined {
  return MOCK_DEFENDERS.find((d) => d.pid === pid);
}

export function formatDates(birth: string | null, death: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
  if (birth && death) return `${fmt(birth)} — ${fmt(death)}`;
  if (death) return fmt(death);
  if (birth) return fmt(birth);
  return "";
}
