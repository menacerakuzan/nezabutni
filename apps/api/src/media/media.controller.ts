import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { MediaService, type UploadedFile as Upload } from "./media.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";
import { config } from "../config";

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Завантаження файлу родиною. 20 файлів за 10 хвилин. */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: config.uploads.maxBytes } })
  )
  upload(@UploadedFile() file: Upload, @CurrentUser() user: CurrentUserPayload) {
    return this.media.upload(file, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("mine")
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.media.listMine(user.userId);
  }

  @Get("file/:id")
  async file(@Param("id", ParseUUIDPipe) id: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.media.getFile(id);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    // Файл ніколи не виконується як сторінка, навіть якщо всередині HTML
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  }
}
