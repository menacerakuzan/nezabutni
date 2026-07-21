import { SectionPlaceholder } from "../../components/SectionPlaceholder";

export const metadata = { title: "Доступність — Незабутні" };

export default function AccessibilityPage() {
  return (
    <SectionPlaceholder
      eyebrow="Доступність"
      title="Доступність"
      description="Платформа проєктується відповідно до WCAG 2.2 AA: клавіатурна навігація, читання скрін-рідером, контрастність, повага до prefers-reduced-motion."
      roadmapNote="Вимоги доступності — Master Plan, розділ 06 UX Patterns і розділ 16 Security."
    />
  );
}
