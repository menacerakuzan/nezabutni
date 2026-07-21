import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ModerationService } from "./moderation.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

// Модерація доступна лише moderator/verifier_gov/admin — docs/prd/05-cms-moderation.md, п. 3.7
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("moderator", "verifier_gov", "admin")
@Controller("moderation")
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get("queue")
  queue(@Query("entity_type") entityType?: string, @Query("limit") limit = "20") {
    return this.moderation.queue(entityType, Number(limit) || 20);
  }

  @Post("queue/:id/decision")
  decide(
    @Param("id") id: string,
    @Body("decision") decision: "approve" | "reject",
    @Body("reason") reason: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.moderation.decide(id, decision, user.userId, reason);
  }
}
