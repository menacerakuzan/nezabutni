import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { SetStatusDto } from "./dto/set-status.dto";
import { RoleCodeDto } from "./dto/role-code.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("admin/users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles("admin", "superadmin")
  @Get()
  list() {
    return this.users.list();
  }

  @Roles("admin", "superadmin")
  @Get("roles")
  roles() {
    return this.users.roles();
  }

  @Roles("admin", "superadmin")
  @Patch(":id/status")
  setStatus(@Param("id") id: string, @Body() dto: SetStatusDto, @CurrentUser() user: CurrentUserPayload) {
    return this.users.setStatus(id, dto.status, user.userId);
  }

  // Видача/відкликання ролей — лише superadmin, щоб адмін не міг
  // призначити собі чи іншим superadmin (ескалація прав).
  @Roles("superadmin")
  @Post(":id/roles")
  grantRole(@Param("id") id: string, @Body() dto: RoleCodeDto, @CurrentUser() user: CurrentUserPayload) {
    return this.users.grantRole(id, dto.role, user.userId);
  }

  @Roles("superadmin")
  @Delete(":id/roles/:role")
  revokeRole(@Param("id") id: string, @Param("role") role: string, @CurrentUser() user: CurrentUserPayload) {
    return this.users.revokeRole(id, role, user.userId);
  }
}
