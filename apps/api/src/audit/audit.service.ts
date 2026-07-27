import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

/**
 * Журнал змін: хто, коли, що зробив. Пишеться при кожній дії
 * адміністратора над контентом — видалення, публікація, редагування
 * структури сайту. Читає /admin/audit.
 *
 * Запис у журнал ніколи не повинен зривати основну операцію — якщо
 * логування не вдалося, ми лише пишемо в консоль сервера й продовжуємо.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId: string | null;
    action: string;
    entityType?: string;
    entityId?: string;
    diff?: unknown;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          diff: params.diff as never,
        },
      });
    } catch (err) {
      this.logger.warn(`Не вдалося записати audit log: ${(err as Error).message}`);
    }
  }

  async list(params: { page?: number; pageSize?: number; entityType?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 30));
    const where = params.entityType ? { entityType: params.entityType } : {};

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { displayName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((i) => ({
        id: i.id.toString(),
        actor: i.actor ? { displayName: i.actor.displayName, email: i.actor.email } : null,
        action: i.action,
        entityType: i.entityType,
        entityId: i.entityId,
        diff: i.diff,
        createdAt: i.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
