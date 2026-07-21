// Один badge_status на три словникові площини схеми (verification / moderation /
// content status). Тонований скляний пил на темному ґрунті: крапка + лейбл.
const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  verified: { label: "Підтверджено", dot: "bg-good", text: "text-good" },
  approved: { label: "Підтверджено", dot: "bg-good", text: "text-good" },
  published: { label: "Опубліковано", dot: "bg-good", text: "text-good" },
  pending: { label: "На перевірці", dot: "bg-warn", text: "text-warn" },
  in_review: { label: "На рецензії", dot: "bg-warn", text: "text-warn" },
  disputed: { label: "Уточнюється", dot: "bg-crimson-bright", text: "text-crimson-bright" },
  rejected: { label: "Відхилено", dot: "bg-crimson-bright", text: "text-crimson-bright" },
  flagged: { label: "Позначено", dot: "bg-crimson-bright", text: "text-crimson-bright" },
  draft: { label: "Чернетка", dot: "bg-white/40", text: "text-ink-lo" },
  archived: { label: "В архіві", dot: "bg-white/40", text: "text-ink-lo" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, dot: "bg-white/40", text: "text-ink-lo" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-hair bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
