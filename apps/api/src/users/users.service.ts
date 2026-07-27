import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AuditService } from "../audit/audit.service";

/** Керування користувачами й ролями — раніше не існувало, /admin/users був каркасом. */
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async list() {
    const users = await this.prisma.appUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        createdAt: true,
        roles: { select: { role: { select: { code: true, nameUk: true } } } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      status: u.status,
      createdAt: u.createdAt,
      roles: u.roles.map((r) => r.role.code),
    }));
  }

  async roles() {
    return this.prisma.role.findMany({ orderBy: { id: "asc" } });
  }

  async setStatus(id: string, status: UserStatus, actorId: string) {
    try {
      await this.prisma.appUser.update({ where: { id }, data: { status } });
      await this.audit.log({ actorId, action: "user.status", entityType: "app_user", entityId: id, diff: { status } });
      return { ok: true };
    } catch (err) {
      throw this.notFoundIfMissing(err);
    }
  }

  async grantRole(userId: string, roleCode: string, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new BadRequestException({ code: "unknown_role", message: "Невідома роль." });

    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId: role.id, scopeType: null, scopeId: null },
    });
    if (existing) return { ok: true };

    await this.prisma.userRole.create({
      data: { userId, roleId: role.id, grantedBy: actorId },
    });
    await this.audit.log({ actorId, action: "user.role.grant", entityType: "app_user", entityId: userId, diff: { role: roleCode } });
    return { ok: true };
  }

  async revokeRole(userId: string, roleCode: string, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new BadRequestException({ code: "unknown_role", message: "Невідома роль." });

    await this.prisma.userRole.deleteMany({ where: { userId, roleId: role.id, scopeType: null, scopeId: null } });
    await this.audit.log({ actorId, action: "user.role.revoke", entityType: "app_user", entityId: userId, diff: { role: roleCode } });
    return { ok: true };
  }

  private notFoundIfMissing(err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return new NotFoundException({ code: "not_found", message: "Користувача не знайдено." });
    }
    return err;
  }
}
