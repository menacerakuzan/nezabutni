import { Controller, Get, Param, Query } from "@nestjs/common";
import { MuseumService } from "./museum.service";

@Controller()
export class MuseumController {
  constructor(private readonly museum: MuseumService) {}

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
}
