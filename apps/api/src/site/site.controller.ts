import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SiteService } from "./site.service";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { UpdatePageBlockDto } from "./dto/update-page-block.dto";
import { ReorderBlocksDto } from "./dto/reorder-blocks.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@Controller("site")
export class SiteController {
  constructor(private readonly site: SiteService) {}

  // ── Публічне ──
  @Get("menu")
  menu() {
    return this.site.menu();
  }

  @Get("pages/:page/blocks")
  blocks(@Param("page") page: string) {
    return this.site.pageBlocks(page);
  }

  @Get("routes")
  routes() {
    return this.site.routes();
  }

  // ── Адмінське ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("admin/menu")
  menuAdmin() {
    return this.site.listMenuAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post("admin/menu")
  createMenu(@Body() dto: CreateMenuItemDto, @CurrentUser() user: CurrentUserPayload) {
    return this.site.createMenuItem(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("admin/menu/:id")
  patchMenu(@Param("id") id: string, @Body() dto: UpdateMenuItemDto, @CurrentUser() user: CurrentUserPayload) {
    return this.site.updateMenuItem(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete("admin/menu/:id")
  deleteMenu(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.site.deleteMenuItem(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("admin/pages/:page/blocks")
  blocksAdmin(@Param("page") page: string) {
    return this.site.listPageBlocksAdmin(page);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("admin/blocks/:id")
  patchBlock(@Param("id") id: string, @Body() dto: UpdatePageBlockDto, @CurrentUser() user: CurrentUserPayload) {
    return this.site.updatePageBlock(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post("admin/blocks/reorder")
  reorder(@Body() dto: ReorderBlocksDto) {
    return this.site.reorderPageBlocks(dto.ids);
  }
}
