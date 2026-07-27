import { Module } from "@nestjs/common";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { PrismaService } from "../prisma.service";
import { MEDIA_STORAGE } from "./media.constants";
import { createStorageProvider } from "./storage/storage.factory";

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    PrismaService,
    { provide: MEDIA_STORAGE, useFactory: createStorageProvider },
  ],
  exports: [MediaService],
})
export class MediaModule {}
