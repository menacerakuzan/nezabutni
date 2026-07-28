import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AuditService } from "../audit/audit.service";
import { config } from "../config";
import { textToBlocks, blocksToText } from "../common/blocks.util";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 200) || "bez-nazvy"
  );
}

function mediaUrl(id: string | null): string | null {
  return id ? `${config.uploads.publicBaseUrl}/${id}` : null;
}

@Injectable()
export class MuseumService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ── Публічне ──

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
        coverUrl: mediaUrl(e.coverMediaId),
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
      coverUrl: mediaUrl(e.coverMediaId),
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
      coverUrl: mediaUrl(s.coverMediaId),
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
        coverUrl: mediaUrl(s.coverMediaId),
        publishedAt: s.publishedAt,
      })),
      next_cursor: null,
      total_estimate: items.length,
    };
  }

  // ── Адмінське: тексти пам'яті ──

  async listStoriesAdmin() {
    const items = await this.prisma.story.findMany({ orderBy: { createdAt: "desc" } });
    return items.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      summary: s.summary,
      body: blocksToText(s.blocks),
      coverMediaId: s.coverMediaId,
      status: s.status,
      createdAt: s.createdAt,
    }));
  }

  async createStory(dto: { title: string; summary?: string; body: string; coverMediaId?: string }, actorId: string) {
    const slug = await this.uniqueSlug("story", dto.title);
    const story = await this.prisma.story.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        blocks: textToBlocks(dto.body),
        coverMediaId: dto.coverMediaId,
        authorId: actorId,
        status: "draft",
      },
    });
    await this.audit.log({ actorId, action: "story.create", entityType: "story", entityId: story.id, diff: { title: dto.title } });
    return story;
  }

  async updateStory(
    id: string,
    dto: { title?: string; summary?: string; body?: string; coverMediaId?: string; status?: "draft" | "published" },
    actorId: string,
  ) {
    const current = await this.prisma.story.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ code: "not_found", message: "Історію не знайдено" });
    const publishing = dto.status === "published" && current.status !== "published";
    try {
      const story = await this.prisma.story.update({
        where: { id },
        data: {
          title: dto.title,
          summary: dto.summary,
          blocks: dto.body !== undefined ? textToBlocks(dto.body) : undefined,
          coverMediaId: dto.coverMediaId,
          status: dto.status,
          publishedAt: publishing ? new Date() : undefined,
        },
      });
      await this.audit.log({ actorId, action: "story.update", entityType: "story", entityId: id, diff: dto });
      return story;
    } catch (err) {
      throw this.notFoundIfMissing(err, "Історію не знайдено");
    }
  }

  async removeStory(id: string, actorId: string) {
    try {
      const story = await this.prisma.story.delete({ where: { id } });
      await this.audit.log({ actorId, action: "story.delete", entityType: "story", entityId: id, diff: { title: story.title } });
      return { ok: true };
    } catch (err) {
      throw this.notFoundIfMissing(err, "Історію не знайдено");
    }
  }

  // ── Адмінське: музейні зали ──

  async listExhibitsAdmin() {
    const items = await this.prisma.exhibit.findMany({ orderBy: { createdAt: "desc" } });
    return items.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      summary: e.summary,
      body: blocksToText(e.blocks),
      coverMediaId: e.coverMediaId,
      status: e.status,
      createdAt: e.createdAt,
    }));
  }

  async createExhibit(dto: { title: string; summary?: string; body: string; coverMediaId?: string }, actorId: string) {
    const slug = await this.uniqueSlug("exhibit", dto.title);
    const exhibit = await this.prisma.exhibit.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        blocks: textToBlocks(dto.body),
        coverMediaId: dto.coverMediaId,
        curatorId: actorId,
        status: "draft",
      },
    });
    await this.audit.log({ actorId, action: "exhibit.create", entityType: "exhibit", entityId: exhibit.id, diff: { title: dto.title } });
    return exhibit;
  }

  async updateExhibit(
    id: string,
    dto: { title?: string; summary?: string; body?: string; coverMediaId?: string; status?: "draft" | "published" },
    actorId: string,
  ) {
    const current = await this.prisma.exhibit.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ code: "not_found", message: "Експозицію не знайдено" });
    const publishing = dto.status === "published" && current.status !== "published";
    try {
      const exhibit = await this.prisma.exhibit.update({
        where: { id },
        data: {
          title: dto.title,
          summary: dto.summary,
          blocks: dto.body !== undefined ? textToBlocks(dto.body) : undefined,
          coverMediaId: dto.coverMediaId,
          status: dto.status,
          publishedAt: publishing ? new Date() : undefined,
        },
      });
      await this.audit.log({ actorId, action: "exhibit.update", entityType: "exhibit", entityId: id, diff: dto });
      return exhibit;
    } catch (err) {
      throw this.notFoundIfMissing(err, "Експозицію не знайдено");
    }
  }

  async removeExhibit(id: string, actorId: string) {
    try {
      const exhibit = await this.prisma.exhibit.delete({ where: { id } });
      await this.audit.log({ actorId, action: "exhibit.delete", entityType: "exhibit", entityId: id, diff: { title: exhibit.title } });
      return { ok: true };
    } catch (err) {
      throw this.notFoundIfMissing(err, "Експозицію не знайдено");
    }
  }

  private async uniqueSlug(model: "story" | "exhibit", title: string): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let i = 1;
    while (
      model === "story"
        ? await this.prisma.story.findUnique({ where: { slug } })
        : await this.prisma.exhibit.findUnique({ where: { slug } })
    ) {
      slug = `${base}-${++i}`;
    }
    return slug;
  }

  private notFoundIfMissing(err: unknown, message: string) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return new NotFoundException({ code: "not_found", message });
    }
    return err;
  }
}
