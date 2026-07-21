import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class ArchiveService {
  constructor(private prisma: PrismaService) {}

  async search(params: { q?: string; kind?: string; rightsStatement?: string; limit: number }) {
    const where: any = { status: "published" };
    if (params.kind) where.kind = params.kind;
    if (params.rightsStatement) where.rightsStatement = params.rightsStatement;
    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: "insensitive" } },
        { ocrText: { contains: params.q, mode: "insensitive" } },
        { description: { contains: params.q, mode: "insensitive" } },
      ];
    }

    const items = await this.prisma.mediaAsset.findMany({
      where,
      take: params.limit,
      orderBy: { createdAt: "desc" },
    });

    return {
      items: items.map((m) => ({
        id: m.id,
        kind: m.kind,
        title: m.title,
        thumbnailUrl: null,
        rightsStatement: m.rightsStatement,
        date: m.createdAt.toISOString().slice(0, 10),
      })),
      next_cursor: null,
      total_estimate: items.length,
    };
  }

  async getById(id: string) {
    const m = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: { derivatives: true },
    });
    if (!m || m.status !== "published") {
      throw new NotFoundException({ code: "not_found", message: "Документ не знайдено" });
    }
    return {
      id: m.id,
      kind: m.kind,
      title: m.title,
      thumbnailUrl: null,
      rightsStatement: m.rightsStatement,
      date: m.createdAt.toISOString().slice(0, 10),
      ocrText: m.ocrText,
      exif: m.exif,
      provenance: m.provenance,
      iiifManifestUrl: m.iiifManifestUri,
      derivatives: m.derivatives.map((d) => ({ type: d.type, url: d.uri })),
    };
  }
}
