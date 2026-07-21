import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class MuseumService {
  constructor(private prisma: PrismaService) {}

  async listExhibits(collectionId?: string) {
    const items = await this.prisma.exhibit.findMany({
      where: { status: "published", collectionId: collectionId || undefined },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    return {
      items: items.map((e) => ({
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        coverUrl: null,
      })),
      next_cursor: null,
      total_estimate: items.length,
    };
  }

  async getExhibitBySlug(slug: string) {
    const e = await this.prisma.exhibit.findUnique({
      where: { slug },
      include: { defenders: { include: { defender: true } } },
    });
    if (!e || e.status !== "published") {
      throw new NotFoundException({ code: "not_found", message: "Експозицію не знайдено" });
    }
    return {
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      blocks: e.blocks,
      modelUri: e.modelUri,
      panoramaUri: e.panoramaUri,
      relatedDefenders: e.defenders.map((d) => d.defender.fullName),
    };
  }

  async getStoryBySlug(slug: string) {
    const s = await this.prisma.story.findUnique({ where: { slug } });
    if (!s || s.status !== "published") {
      throw new NotFoundException({ code: "not_found", message: "Історію не знайдено" });
    }
    return {
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      blocks: s.blocks,
      timeline: s.timeline,
      publishedAt: s.publishedAt,
    };
  }

  async listStories() {
    const items = await this.prisma.story.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    return {
      items: items.map((s) => ({
        slug: s.slug,
        title: s.title,
        summary: s.summary,
        coverUrl: null,
        publishedAt: s.publishedAt,
      })),
      next_cursor: null,
      total_estimate: items.length,
    };
  }
}
