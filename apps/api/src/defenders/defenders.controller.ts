import { Body, Controller, Delete, Get, Post, Param, Query, Headers, Ip, UseGuards } from "@nestjs/common";
import { DefendersService } from "./defenders.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@Controller("defenders")
export class DefendersController {
  constructor(private readonly defenders: DefendersService) {}

  // GET /defenders — docs/api/openapi.yaml
  @Get()
  list(
    @Query("q") q?: string,
    @Query("unit_id") unitId?: string,
    @Query("region_id") regionId?: string,
    @Query("limit") limit = "20",
  ) {
    return this.defenders.list({ q, unitId, regionId, limit: Number(limit) || 20 });
  }

  // GET /defenders/{pid}
  @Get(":pid")
  getOne(@Param("pid") pid: string) {
    return this.defenders.getByPid(pid);
  }

  // POST /defenders/{pid}/candles
  @Post(":pid/candles")
  lightCandle(@Param("pid") pid: string, @Ip() ip: string, @Headers("x-session-fingerprint") fp?: string) {
    return this.defenders.lightCandle(pid, fp || ip);
  }

  // GET /defenders/{pid}/memories — схвалені спогади (публічно)
  @Get(":pid/memories")
  listMemories(@Param("pid") pid: string, @Query("limit") limit = "20") {
    return this.defenders.listMemories(pid, Number(limit) || 20);
  }

  // DELETE /defenders/{pid} — адмінське видалення з каскадом дочірніх записів
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete(":pid")
  remove(@Param("pid") pid: string, @CurrentUser() user: CurrentUserPayload) {
    return this.defenders.remove(pid, user.userId);
  }

  // POST /defenders/{pid}/memories — новий спогад, потребує модерації
  @UseGuards(JwtAuthGuard)
  @Post(":pid/memories")
  addMemory(
    @Param("pid") pid: string,
    @Body("body") body: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.defenders.addMemory(pid, user.userId, body);
  }
}
