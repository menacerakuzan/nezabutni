import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AuditService } from "../audit/audit.service";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/** Новини платформи: раніше /admin/news був каркасом без збереження. */
@Injectable()
export class NewsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ── Публічне: лише опубліковані ──
  async listPublished() {
    const posts = await this.prisma.newsPost.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true, category: true, excerpt: true, publishedAt: true },
    });
    return posts;
  }

  async getPublishedBySlug(slug: string) {
    const post = await this.prisma.newsPost.findFirst({
      where: { slug, status: "published" },
      include: { author: { select: { displayName: true } } },
    });
    if (!post) throw new NotFoundException({ code: "not_found", message: "Новину не знайдено." });
    return post;
  }

  // ── Адмінське ──
  async listAdmin() {
    return this.prisma.newsPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { displayName: true } } },
    });
  }

  async create(data: { title: string; category: string; excerpt?: string; body: string }, actorId: string) {
    const baseSlug = slugify(data.title) || "novyna";
    let slug = baseSlug;
    let i = 1;
    while (await this.prisma.newsPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++i}`;
    }

    const post = await this.prisma.newsPost.create({
      data: { ...data, slug, authorId: actorId, status: "draft" },
    });
    await this.audit.log({ actorId, action: "news.create", entityType: "news_post", entityId: post.id, diff: { title: post.title } });
    return post;
  }

  async update(
    id: string,
    data: { title?: string; category?: string; excerpt?: string; body?: string; status?: "draft" | "published" },
    actorId: string,
  ) {
    const current = await this.prisma.newsPost.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ code: "not_found", message: "Новину не знайдено." });

    const publishing = data.status === "published" && current.status !== "published";
    try {
      const post = await this.prisma.newsPost.update({
        where: { id },
        data: { ...data, publishedAt: publishing ? new Date() : undefined },
      });
      await this.audit.log({ actorId, action: "news.update", entityType: "news_post", entityId: id, diff: data });
      return post;
    } catch (err) {
      throw this.notFoundIfMissing(err);
    }
  }

  async remove(id: string, actorId: string) {
    try {
      const post = await this.prisma.newsPost.delete({ where: { id } });
      await this.audit.log({ actorId, action: "news.delete", entityType: "news_post", entityId: id, diff: { title: post.title } });
      return { ok: true };
    } catch (err) {
      throw this.notFoundIfMissing(err);
    }
  }

  private notFoundIfMissing(err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return new NotFoundException({ code: "not_found", message: "Новину не знайдено." });
    }
    return err;
  }
}
