import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { NewsService } from "./news.service";
import { CreateNewsDto } from "./dto/create-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@Controller()
export class NewsController {
  constructor(private readonly news: NewsService) {}

  // ── Публічне ──
  @Get("news")
  list() {
    return this.news.listPublished();
  }

  @Get("news/:slug")
  bySlug(@Param("slug") slug: string) {
    return this.news.getPublishedBySlug(slug);
  }

  // ── Адмінське ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin", "editor")
  @Get("admin/news")
  listAdmin() {
    return this.news.listAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin", "editor")
  @Post("admin/news")
  create(@Body() dto: CreateNewsDto, @CurrentUser() user: CurrentUserPayload) {
    return this.news.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin", "editor")
  @Patch("admin/news/:id")
  update(@Param("id") id: string, @Body() dto: UpdateNewsDto, @CurrentUser() user: CurrentUserPayload) {
    return this.news.update(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete("admin/news/:id")
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.news.remove(id, user.userId);
  }
}
