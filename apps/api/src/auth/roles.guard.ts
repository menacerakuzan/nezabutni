import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const roles: string[] = user?.roles ?? [];
    // superadmin проходить будь-яку перевірку ролей (docs/prd/05-cms-moderation.md, RBAC)
    const allowed = roles.includes("superadmin") || required.some((r) => roles.includes(r));
    if (!allowed) {
      throw new ForbiddenException({
        code: "insufficient_role",
        message: `Потрібна роль: ${required.join(" або ")}`,
      });
    }
    return true;
  }
}
