import { SectionPlaceholder } from "../../components/SectionPlaceholder";

export const metadata = { title: "Контакти — Незабутні" };

export default function ContactsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Контакти"
      title="Контакти"
      description="Зв'язатися з командою платформи можна для питань про верифікацію профілю, партнерство або технічну підтримку."
      roadmapNote="Форма зворотного зв'язку та інтеграція з чергою підтримки — наступний крок після MVP реєстру."
    />
  );
}
