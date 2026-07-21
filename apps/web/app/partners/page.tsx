import { SectionPlaceholder } from "../../components/SectionPlaceholder";

export const metadata = { title: "Партнери — Незабутні" };

export default function PartnersPage() {
  return (
    <SectionPlaceholder
      eyebrow="Партнери"
      title="Партнери"
      description="Музеї, архіви й державні установи, що поповнюють платформу колекціями та верифікують дані захисників."
      roadmapNote="Кабінет партнера (bulk-завантаження, керування колекціями) — docs/prd/04-archive.md, розділ 3.7."
    />
  );
}
