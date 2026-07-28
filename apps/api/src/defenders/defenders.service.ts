import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuditService } from "../audit/audit.service";
import { generateDefenderPid } from "../common/pid.util";
import { config } from "../config";

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
      portraitUrl: d.portraitMediaId ? `${config.uploads.publicBaseUrl}/${d.portraitMediaId}` : null,
      excerpt: d.bio ? (d.bio.length > 160 ? d.bio.slice(0, 157) + "…" : d.bio) : "",
      verificationStatus: d.verificationStatus,
      lon: coords?.lon ?? null,
      lat: coords?.lat ?? null,
    };
  }

  /**
   * Координати місця, найтісніше повʼязаного з захисником: поховання й
   * загибель (defender_place_role) мають пріоритет над просто "служив",
   * а місце народження (birth_place_id) — це фолбек в останню чергу,
   * коли інших звʼязок немає. Один запит на весь список — без N+1.
   */
  private async coordsByDefenderId(defenderIds: string[]): Promise<Map<string, { lon: number; lat: number }>> {
    if (!defenderIds.length) return new Map();
    const rows = await this.prisma.$queryRaw<{ defender_id: string; lon: number; lat: number }[]>`
      SELECT DISTINCT ON (id) id AS defender_id, lon, lat FROM (
        SELECT dpr.defender_id AS id,
               ST_X(p.geom_point::geometry) AS lon,
               ST_Y(p.geom_point::geometry) AS lat,
               CASE dpr.role WHEN 'buried_at' THEN 0 WHEN 'died_at' THEN 1 ELSE 2 END AS priority
        FROM defender_place_role dpr
        JOIN place p ON p.id = dpr.place_id
        WHERE dpr.defender_id = ANY(${defenderIds}::uuid[]) AND p.geom_point IS NOT NULL
        UNION ALL
        SELECT d.id, ST_X(p.geom_point::geometry), ST_Y(p.geom_point::geometry), 3
        FROM defender d
        JOIN place p ON p.id = d.birth_place_id
        WHERE d.id = ANY(${defenderIds}::uuid[]) AND p.geom_point IS NOT NULL
      ) combined
      ORDER BY id, priority
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
   * Пряме створення захисника адміністратором/модератором — на відміну
   * від заявки родини, публікується одразу (без черги на розгляд), бо
   * автор дії вже має право контенту довіряти.
   */
  async create(
    dto: {
      fullName: string;
      birthDate?: string;
      deathDate?: string;
      bio?: string;
      callsign?: string;
      portraitMediaId?: string;
    },
    actorId: string,
  ) {
    const pid = await generateDefenderPid(this.prisma);
    const defender = await this.prisma.defender.create({
      data: {
        pid,
        fullName: dto.fullName,
        fullNameNormalized: dto.fullName.toLowerCase(),
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : null,
        bio: dto.bio || null,
        callsign: dto.callsign || null,
        portraitMediaId: dto.portraitMediaId || null,
        status: "published",
        verificationStatus: "verified",
        verifiedBy: actorId,
        verifiedAt: new Date(),
        createdBy: actorId,
      },
    });
    await this.audit.log({
      actorId,
      action: "defender.create",
      entityType: "defender",
      entityId: defender.id,
      diff: { pid, fullName: dto.fullName },
    });
    return this.toSummary(defender);
  }

  /** Адмінське редагування вже створеного запису — ім'я, дати, біо, портрет. */
  async update(
    pid: string,
    dto: {
      fullName?: string;
      birthDate?: string;
      deathDate?: string;
      bio?: string;
      portraitMediaId?: string;
      lon?: number;
      lat?: number;
    },
    actorId: string,
  ) {
    const existing = await this.prisma.defender.findUnique({ where: { pid } });
    if (!existing) throw new NotFoundException({ code: "not_found", message: "Захисника не знайдено" });

    let birthPlaceId: string | undefined;
    if (dto.lon !== undefined && dto.lat !== undefined) {
      birthPlaceId = await this.setBirthPoint(existing.id, existing.birthPlaceId, existing.fullName, dto.lon, dto.lat);
    }

    const defender = await this.prisma.defender.update({
      where: { pid },
      data: {
        fullName: dto.fullName,
        fullNameNormalized: dto.fullName ? dto.fullName.toLowerCase() : undefined,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : undefined,
        bio: dto.bio,
        portraitMediaId: dto.portraitMediaId,
        birthPlaceId,
      },
    });
    await this.audit.log({ actorId, action: "defender.update", entityType: "defender", entityId: defender.id, diff: dto });
    return this.toSummary(defender);
  }

  /**
   * Точка на Полі вогнів — адмінське ручне виправлення. Місце народження
   * часто спільне (десятки людей з "Одеса" вказують на той самий place
   * після геокодингу) — рухати його напряму означало б зсунути точку й
   * усім іншим. Тож рухаємо geom_point тільки якщо це місце належить
   * винятково цьому захиснику; інакше створюємо окрему точку саме для нього.
   */
  private async setBirthPoint(
    defenderId: string,
    currentPlaceId: string | null,
    fullName: string,
    lon: number,
    lat: number,
  ): Promise<string> {
    let placeId = currentPlaceId;
    if (placeId) {
      const otherOwners = await this.prisma.defender.count({
        where: { birthPlaceId: placeId, id: { not: defenderId } },
      });
      if (otherOwners > 0) placeId = null;
    }
    if (!placeId) {
      placeId = (
        await this.prisma.place.create({
          data: { type: "settlement", name: `Місце народження: ${fullName}`, status: "published" },
        })
      ).id;
    }
    await this.prisma.$executeRawUnsafe(
      `UPDATE "place" SET "geom_point" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3::uuid`,
      lon,
      lat,
      placeId,
    );
    return placeId;
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
