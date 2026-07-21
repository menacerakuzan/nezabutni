import { SectionPlaceholder } from "../../components/SectionPlaceholder";

export const metadata = { title: "Зробити внесок — Незабутні" };

export default function DonatePage() {
  return (
    <SectionPlaceholder
      eyebrow="Підтримка"
      title="Зробити внесок"
      description="Кожен донат допомагає оцифровувати фонди, верифікувати профілі захисників і розвивати платформу пам’яті."
      roadmapNote="Інтеграція з платіжним провайдером — поза межами MVP реєстру, планується разом з Ф0 (Master Plan, розділ 20 Roadmap)."
    />
  );
}
