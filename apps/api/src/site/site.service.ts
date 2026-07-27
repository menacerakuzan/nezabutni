import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AuditService } from "../audit/audit.service";

/**
 * Публічна структура сайту: навігація, блоки сторінок, маршрути пам'яті.
 * Раніше все це було зашите в код фронтенду — тепер редагується в адмінці.
 */
@Injectable()
export class SiteService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /** Меню згруповане за місцем розташування (хедер, колонки футера). */
  async menu() {
    const items = await this.prisma.menuItem.findMany({
      where: { visible: true },
      orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
    });
    const grouped: Record<string, { label: string; href: string }[]> = {};
    for (const i of items) {
      (grouped[i.location] ??= []).push({ label: i.label, href: i.href });
    }
    return grouped;
  }

  /** Блоки конкретної сторінки у порядку показу. */
  async pageBlocks(page: string) {
    const blocks = await this.prisma.pageBlock.findMany({
      where: { page, visible: true },
      orderBy: { sortOrder: "asc" },
    });
    return blocks.map((b) => ({
      id: b.id,
      type: b.blockType,
      label: b.label,
      props: b.props ?? {},
    }));
  }

  /**
   * Маршрути пам'яті з точками для кінематографічного обльоту.
   * Координати дістаємо сирим SQL — geography-колонки Prisma не читає.
   */
  async routes() {
    const routes = await this.prisma.memoryRoute.findMany({
      where: { status: "published" },
      include: {
        places: { orderBy: { seqOrder: "asc" }, include: { place: true } },
      },
    });
    if (!routes.length) return [];

    const placeIds = routes.flatMap((r) => r.places.map((rp) => rp.placeId));
    const coords = placeIds.length
      ? await this.prisma.$queryRaw<{ id: string; lon: number; lat: number }[]>`
          SELECT id::text,
                 ST_X(geom_point::geometry) AS lon,
                 ST_Y(geom_point::geometry) AS lat
          FROM place
          WHERE id = ANY(${placeIds}::uuid[]) AND geom_point IS NOT NULL
        `
      : [];
    const byId = new Map(coords.map((c) => [c.id, c]));

    return routes.map((r) => ({
      slug: r.slug,
      title: r.title,
      description: r.description,
      stops: r.places
        .map((rp) => {
          const c = byId.get(rp.placeId);
          if (!c) return null;
          return {
            name: rp.place.name,
            text: rp.place.description,
            placeId: rp.placeId,
            center: [Number(c.lon), Number(c.lat)] as [number, number],
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    }));
  }

  // ── Адмінські операції ──

  async listMenuAdmin() {
    return this.prisma.menuItem.findMany({
      orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
    });
  }

  async updateMenuItem(
    id: string,
    data: { visible?: boolean; sortOrder?: number; label?: string; href?: string },
    actorId: string,
  ) {
    try {
      const item = await this.prisma.menuItem.update({ where: { id }, data });
      await this.audit.log({ actorId, action: "menu.update", entityType: "menu_item", entityId: id, diff: data });
      return item;
    } catch (err) {
      throw this.notFoundIfMissing(err, "Пункт меню не знайдено.");
    }
  }

  async createMenuItem(data: { label: string; href: string; location: string }, actorId: string) {
    const maxOrder = await this.prisma.menuItem.aggregate({
      where: { location: data.location },
      _max: { sortOrder: true },
    });
    const item = await this.prisma.menuItem.create({
      data: { ...data, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    });
    await this.audit.log({ actorId, action: "menu.create", entityType: "menu_item", entityId: item.id, diff: data });
    return item;
  }

  async deleteMenuItem(id: string, actorId: string) {
    try {
      const item = await this.prisma.menuItem.delete({ where: { id } });
      await this.audit.log({
        actorId,
        action: "menu.delete",
        entityType: "menu_item",
        entityId: id,
        diff: { label: item.label, href: item.href },
      });
      return { ok: true };
    } catch (err) {
      throw this.notFoundIfMissing(err, "Пункт меню не знайдено.");
    }
  }

  async listPageBlocksAdmin(page: string) {
    return this.prisma.pageBlock.findMany({ where: { page }, orderBy: { sortOrder: "asc" } });
  }

  async updatePageBlock(id: string, data: { visible?: boolean; sortOrder?: number }, actorId: string) {
    try {
      const block = await this.prisma.pageBlock.update({ where: { id }, data });
      await this.audit.log({ actorId, action: "block.update", entityType: "page_block", entityId: id, diff: data });
      return block;
    } catch (err) {
      throw this.notFoundIfMissing(err, "Блок сторінки не знайдено.");
    }
  }

  /** Перестановка блоків одним запитом — атомарно: або всі, або жоден. */
  async reorderPageBlocks(ids: string[]) {
    try {
      await this.prisma.$transaction(
        ids.map((id, index) =>
          this.prisma.pageBlock.update({ where: { id }, data: { sortOrder: index } })
        )
      );
    } catch (err) {
      throw this.notFoundIfMissing(err, "Один із блоків не знайдено — порядок не змінено.");
    }
    return { ok: true, count: ids.length };
  }

  /** Prisma P2025 ("запис не знайдено") → зрозуміла 404 замість голої 500-ї. */
  private notFoundIfMissing(err: unknown, message: string) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return new NotFoundException({ code: "not_found", message });
    }
    return err;
  }
}
