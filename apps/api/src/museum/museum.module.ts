import { Module } from "@nestjs/common";
import { MuseumController } from "./museum.controller";
import { MuseumService } from "./museum.service";
import { PrismaService } from "../prisma.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [MuseumController],
  providers: [MuseumService, PrismaService],
})
export class MuseumModule {}
