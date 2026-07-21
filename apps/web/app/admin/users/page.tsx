"use client";

import { useAuth } from "../../../components/AuthProvider";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Суперадміністратор",
  admin: "Адміністратор",
  moderator: "Модератор",
  editor: "Редактор громади",
  family: "Родина",
  user: "Користувач",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-cream">Користувачі</h1>
      <p className="mt-1 text-sm text-ink-lo">Ролі, доступи й безпека акаунтів</p>

      <section className="mt-6 max-w-2xl rounded-[4px] border border-hair p-5">
        <h2 className="caption">Поточна сесія</h2>
        <p className="mt-3 font-semibold text-cream">{user?.displayName}</p>
        <p className="text-sm text-ink">{user?.email}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user?.roles.map((r) => (
            <span key={r} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-cream">
              {ROLE_LABEL[r] ?? r}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 max-w-2xl rounded-[4px] border border-hair p-5">
        <h2 className="caption">Рольова модель (RBAC)</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink">
          <li><b className="text-cream">Родина</b> — подає та доповнює сторінки своїх близьких</li>
          <li><b className="text-cream">Редактор громади</b> — місця пам’яті своєї громади на карті</li>
          <li><b className="text-cream">Модератор</b> — верифікація заявок і спогадів</li>
          <li><b className="text-cream">Адміністратор</b> — контент, користувачі, налаштування</li>
          <li><b className="text-cream">Суперадміністратор</b> — повний доступ, журнал безпеки</li>
        </ul>
      </section>

      <section className="mt-6 max-w-2xl rounded-[4px] border border-hair p-5">
        <h2 className="caption">Безпека (дорожня карта)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            ["JWT-сесії з ролями", true],
            ["Перевірка ролей на кожному admin-запиті", true],
            ["Двофакторна автентифікація (TOTP) для адмінів", false],
            ["Історія входів і активні сесії", false],
            ["Ліміт спроб входу (rate limiting)", false],
            ["Журнал дій користувачів", false],
          ].map(([label, done]) => (
            <li key={label as string} className="flex items-center justify-between gap-4">
              <span className="text-ink">{label}</span>
              <span className={done ? "text-good" : "text-ink-faint"}>{done ? "працює" : "етап 2"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
