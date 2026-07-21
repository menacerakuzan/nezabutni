import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { CreatePlaceDto, UpdatePlaceDto } from "./dto/place.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@Controller("places")
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get()
  list(@Query("layer") layer?: string, @Query("bbox") bbox?: string) {
    return this.places.list(layer, bbox);
  }

  // Адмінський список (усі статуси) для /admin/places — docs/prd/02-interactive-map.md
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("editor", "admin", "superadmin")
  @Get("admin")
  adminList() {
    return this.places.adminList();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("editor", "admin", "superadmin")
  @Post()
  create(@Body() dto: CreatePlaceDto, @CurrentUser() user: CurrentUserPayload) {
    return this.places.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("editor", "admin", "superadmin")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePlaceDto) {
    return this.places.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("editor", "admin", "superadmin")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.places.remove(id);
  }
}
