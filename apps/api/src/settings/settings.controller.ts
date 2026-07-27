import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("site/settings")
  get() {
    return this.settings.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("admin/settings")
  update(@Body() dto: UpdateSettingsDto, @CurrentUser() user: CurrentUserPayload) {
    return this.settings.update(dto, user.userId);
  }
}
