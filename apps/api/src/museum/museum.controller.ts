import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { MuseumService } from "./museum.service";
import { CreateStoryDto, UpdateStoryDto } from "./dto/story.dto";
import { CreateExhibitDto, UpdateExhibitDto } from "./dto/exhibit.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@Controller()
export class MuseumController {
  constructor(private readonly museum: MuseumService) {}

  // ── Публічне ──
  @Get("exhibits")
  listExhibits(@Query("collection_id") collectionId?: string) {
    return this.museum.listExhibits(collectionId);
  }

  @Get("exhibits/:slug")
  getExhibit(@Param("slug") slug: string) {
    return this.museum.getExhibitBySlug(slug);
  }

  @Get("stories")
  listStories() {
    return this.museum.listStories();
  }

  @Get("stories/:slug")
  getStory(@Param("slug") slug: string) {
    return this.museum.getStoryBySlug(slug);
  }

  // ── Адмінське: тексти пам'яті ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("admin/stories")
  listStoriesAdmin() {
    return this.museum.listStoriesAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post("admin/stories")
  createStory(@Body() dto: CreateStoryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.museum.createStory(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("admin/stories/:id")
  updateStory(@Param("id") id: string, @Body() dto: UpdateStoryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.museum.updateStory(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete("admin/stories/:id")
  removeStory(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.museum.removeStory(id, user.userId);
  }

  // ── Адмінське: музейні зали ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("admin/exhibits")
  listExhibitsAdmin() {
    return this.museum.listExhibitsAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post("admin/exhibits")
  createExhibit(@Body() dto: CreateExhibitDto, @CurrentUser() user: CurrentUserPayload) {
    return this.museum.createExhibit(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("admin/exhibits/:id")
  updateExhibit(@Param("id") id: string, @Body() dto: UpdateExhibitDto, @CurrentUser() user: CurrentUserPayload) {
    return this.museum.updateExhibit(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete("admin/exhibits/:id")
  removeExhibit(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.museum.removeExhibit(id, user.userId);
  }
}
