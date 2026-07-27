import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuditService } from "../audit/audit.service";

export interface DefenderSummaryDto {
  pid: string;
  fullName: string;
  callsign: string | null;
  birthDate: string | null;
  deathDate: string | null;
  unitName: string | null;
  regionName: string | null;
  portraitUrl: string | null;
  excerpt: string;
  verificationStatus: string;
  /**
   * Реальні координати місця, повʼязаного із захисником (поховання, бій,
   * служба — перше знайдене з defender_place_role). null, якщо жодне
   * місце ще не привʼязане: фронтенд тоді сам вирішує, як показати точку
   * (наприклад, за назвою регіону), а не отримує вигадані координати з API.
   */
  lon: number | null;
  lat: number | null;
}

export interface DefenderDto extends DefenderSummaryDto {
  bio: string | null;
  candleCount: number;
}

@Injectable()
export class DefendersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  private toSummary(d: any, coords?: { lon: number; lat: number }): DefenderSummaryDto {
    return {
      pid: d.pid,
      fullName: d.fullName,
      callsign: d.callsign,
      birthDate: d.birthDate ? d.birthDate.toISOString().slice(0, 10) : null,
      deathDate: d.deathDate ? d.deathDate.toISOString().slice(0, 10) : null,
      unitName: d.unit?.name ?? null,
      regionName: d.region?.name ?? null,
      portraitUrl: null,
      excerpt: d.bio ? (d.bio.length > 160 ? d.bio.slice(0, 157) + "…" : d.bio) : "",
      verificationStatus: d.verificationStatus,
      lon: coords?.lon ?? null,
      lat: coords?.lat ?? null,
    };
  }

  /**
   * Координати місця, найтісніше повʼязаного з захисником: перший запис
   * defender_place_role (поховання/бій/служба), сортований так, щоб
   * "поховано" й "загинув" мали пріоритет над просто "служив". Один
   * запит на весь список — без N+1.
   */
  private async coordsByDefenderId(defenderIds: string[]): Promise<Map<string, { lon: number; lat: number }>> {
    if (!defenderIds.length) return new Map();
    const rows = await this.prisma.$queryRaw<{ defender_id: string; lon: number; lat: number; role: string }[]>`
      SELECT DISTINCT ON (dpr.defender_id)
             dpr.defender_id,
             ST_X(p.geom_point::geometry) AS lon,
             ST_Y(p.geom_point::geometry) AS lat,
             dpr.role
      FROM defender_place_role dpr
      JOIN place p ON p.id = dpr.place_id
      WHERE dpr.defender_id = ANY(${defenderIds}::uuid[]) AND p.geom_point IS NOT NULL
      ORDER BY dpr.defender_id,
               CASE dpr.role WHEN 'buried_at' THEN 0 WHEN 'died_at' THEN 1 ELSE 2 END
    `;
    return new Map(rows.map((r) => [r.defender_id, { lon: Number(r.lon), lat: Number(r.lat) }]));
  }

  async list(params: { q?: string; unitId?: string; regionId?: string; limit: number }) {
    const where: any = { status: "published" };
    if (params.q) {
      where.fullNameNormalized = { contains: params.q.toLowerCase() };
    }
    if (params.unitId) where.unitId = params.unitId;
    if (params.regionId) where.regionId = params.regionId;

    const items = await this.prisma.defender.findMany({
      where,
      include: { unit: true, region: true },
      take: params.limit,
      orderBy: { deathDate: "desc" },
    });
    const coords = await this.coordsByDefenderId(items.map((d) => d.id));

    return {
      items: items.map((d) => this.toSummary(d, coords.get(d.id))),
      next_cursor: null,
      total_estimate: items.length,
    };
  }

  async getByPid(pid: string): Promise<DefenderDto> {
    const d = await this.prisma.defender.findUnique({
      where: { pid },
      include: { unit: true, region: true },
    });
    if (!d) throw new NotFoundException({ code: "not_found", message: "Захисника не знайдено" });
    const coords = await this.coordsByDefenderId([d.id]);
    return { ...this.toSummary(d, coords.get(d.id)), bio: d.bio, candleCount: d.candleCount };
  }

  async listMemories(pid: string, limit: number) {
    const d = await this.prisma.defender.findUnique({ where: { pid } });
    if (!d) throw new NotFoundException({ code: "not_found", message: "Захисника не знайдено" });

    const memories = await this.prisma.memoryUgc.findMany({
      where: { defenderId: d.id, status: "approved" },
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      items: memories.map((m) => ({
        id: m.id,
        defenderPid: pid,
        authorDisplayName: m.author.displayName,
        body: m.body,
        mediaUrl: null,
        status: m.status,
        createdAt: m.createdAt,
      })),
      next_cursor: null,
      total_estimate: memories.length,
    };
  }

  async addMemory(pid: string, authorUserId: string, body: string) {
    const d = await this.prisma.defender.findUnique({ where: { pid } });
    if (!d) throw new NotFoundException({ code: "not_found", message: "Захисника не знайдено" });

    const memory = await this.prisma.memoryUgc.create({
      data: { defenderId: d.id, authorUserId, body, status: "pending" },
    });
    return { id: memory.id, defenderPid: pid, status: memory.status, createdAt: memory.createdAt };
  }

  /**
   * Адмінське видалення. Пряме DELETE впирається в RESTRICT-обмеження
   * (нагороди, ролі на місцях, звʼязки, участь у виставках/текстах,
   * спогади, свічки) — вони мають сенс лише разом із власником, тож
   * прибираємо їх у тій самій транзакції. Заявку на подання й записи
   * про згоду НЕ чіпаємо: у них ON DELETE SET NULL — це слід
   * адміністративної дії, який має пережити сам запис.
   */
  async remove(pid: string, actorId: string) {
    const d = await this.prisma.defender.findUnique({ where: { pid } });
    if (!d) throw new NotFoundException({ code: "not_found", message: "Захисника не знайдено" });

    await this.prisma.$transaction([
      this.prisma.defenderAward.deleteMany({ where: { defenderId: d.id } }),
      this.prisma.defenderPlaceRole.deleteMany({ where: { defenderId: d.id } }),
      this.prisma.defenderRelation.deleteMany({
        where: { OR: [{ defenderId: d.id }, { relatedDefenderId: d.id }] },
      }),
      this.prisma.exhibitDefender.deleteMany({ where: { defenderId: d.id } }),
      this.prisma.storyDefender.deleteMany({ where: { defenderId: d.id } }),
      this.prisma.candleLit.deleteMany({ where: { defenderId: d.id } }),
      this.prisma.memoryUgc.deleteMany({ where: { defenderId: d.id } }),
      this.prisma.defender.delete({ where: { id: d.id } }),
    ]);

    await this.audit.log({
      actorId,
      action: "defender.delete",
      entityType: "defender",
      entityId: d.id,
      diff: { pid: d.pid, fullName: d.fullName },
    });

    return { ok: true };
  }

  async lightCandle(pid: string, fingerprint: string) {
    const d = await this.prisma.defender.findUnique({ where: { pid } });
    if (!d) throw new NotFoundException({ code: "not_found", message: "Захисника не знайдено" });

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const already = await this.prisma.candleLit.findFirst({
      where: { defenderId: d.id, sessionFingerprint: fingerprint, createdAt: { gte: since } },
    });
    if (already) return { alreadyLit: true, candleCount: d.candleCount };

    await this.prisma.$transaction([
      this.prisma.candleLit.create({ data: { defenderId: d.id, sessionFingerprint: fingerprint } }),
      this.prisma.defender.update({ where: { id: d.id }, data: { candleCount: { increment: 1 } } }),
    ]);
    return { alreadyLit: false, candleCount: d.candleCount + 1 };
  }
}
