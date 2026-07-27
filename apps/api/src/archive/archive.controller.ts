import { Controller, Get, Param, Query } from "@nestjs/common";
import { ArchiveService } from "./archive.service";

@Controller()
export class ArchiveController {
  constructor(private readonly archive: ArchiveService) {}

  @Get("archive/search")
  search(
    @Query("q") q?: string,
    @Query("kind") kind?: string,
    @Query("rights_statement") rightsStatement?: string,
    @Query("limit") limit = "20",
  ) {
    return this.archive.search({ q, kind, rightsStatement, limit: Number(limit) || 20 });
  }

  // Було "media/:id" — колізувало з MediaController (@Controller("media")):
  // "/media/admin" матчився як media/:id з id="admin". Публічний перегляд
  // документа архіву логічно живе під тим самим префіксом, що й пошук.
  @Get("archive/:id")
  getOne(@Param("id") id: string) {
    return this.archive.getById(id);
  }
}
