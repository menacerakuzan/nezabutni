import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuditService } from "../audit/audit.service";

/** camelCase-ключ у API ↔ snake_case-ключ у site_setting. */
const KEYS = {
  siteName: "site_name",
  tagline: "tagline",
  contactEmail: "contact_email",
} as const;

const DEFAULTS: Record<keyof typeof KEYS, string> = {
  siteName: "Незабутні",
  tagline: "Цифровий меморіал захисників Одеської області",
  contactEmail: "hello@nezabutni.ua",
};

/** Налаштування сайту — раніше назва й опис були зашиті в код, /admin/settings був каркасом. */
@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async get(): Promise<Record<keyof typeof KEYS, string>> {
    const rows = await this.prisma.siteSetting.findMany({ where: { key: { in: Object.values(KEYS) } } });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const result = { ...DEFAULTS };
    for (const [camel, snake] of Object.entries(KEYS) as [keyof typeof KEYS, string][]) {
      const v = byKey.get(snake);
      if (v !== undefined) result[camel] = v;
    }
    return result;
  }

  async update(data: Partial<Record<keyof typeof KEYS, string>>, actorId: string) {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined) as [keyof typeof KEYS, string][];
    await Promise.all(
      entries.map(([camel, value]) =>
        this.prisma.siteSetting.upsert({
          where: { key: KEYS[camel] },
          create: { key: KEYS[camel], value },
          update: { value },
        }),
      ),
    );
    await this.audit.log({ actorId, action: "settings.update", entityType: "site_setting", diff: data });
    return this.get();
  }
}
