import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

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
}

export interface DefenderDto extends DefenderSummaryDto {
  bio: string | null;
  candleCount: number;
}

@Injectable()
export class DefendersService {
  constructor(private prisma: PrismaService) {}

  private toSummary(d: any): DefenderSummaryDto {
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
    };
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

    return {
      items: items.map((d) => this.toSummary(d)),
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
    return { ...this.toSummary(d), bio: d.bio, candleCount: d.candleCount };
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
