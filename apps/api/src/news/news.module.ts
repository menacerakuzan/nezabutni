import { Module } from "@nestjs/common";
import { NewsController } from "./news.controller";
import { NewsService } from "./news.service";
import { PrismaService } from "../prisma.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [NewsController],
  providers: [NewsService, PrismaService],
})
export class NewsModule {}
