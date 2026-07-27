import { Module } from "@nestjs/common";
import { SiteController } from "./site.controller";
import { SiteService } from "./site.service";
import { PrismaService } from "../prisma.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [SiteController],
  providers: [SiteService, PrismaService],
})
export class SiteModule {}
