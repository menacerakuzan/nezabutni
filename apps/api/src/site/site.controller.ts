import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SiteService } from "./site.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

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
  @Patch("admin/menu/:id")
  patchMenu(
    @Param("id") id: string,
    @Body() body: { visible?: boolean; sortOrder?: number; label?: string }
  ) {
    return this.site.updateMenuItem(id, body);
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
  patchBlock(@Param("id") id: string, @Body() body: { visible?: boolean; sortOrder?: number }) {
    return this.site.updatePageBlock(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post("admin/blocks/reorder")
  reorder(@Body() body: { ids: string[] }) {
    return this.site.reorderPageBlocks(body.ids);
  }
}
