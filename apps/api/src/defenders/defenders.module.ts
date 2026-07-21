import { Module } from "@nestjs/common";
import { DefendersController } from "./defenders.controller";
import { DefendersService } from "./defenders.service";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [DefendersController, StatsController],
  providers: [DefendersService, StatsService, PrismaService],
})
export class DefendersModule {}
