import { Module } from "@nestjs/common";
import { ArchiveController } from "./archive.controller";
import { ArchiveService } from "./archive.service";
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [ArchiveController],
  providers: [ArchiveService, PrismaService],
})
export class ArchiveModule {}
