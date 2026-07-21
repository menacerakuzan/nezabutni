import { Injectable, NotFoundException } from "@nestjs/common";
import { PlaceType } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreatePlaceDto, UpdatePlaceDto } from "./dto/place.dto";

interface PlaceRow {
  id: string;
  name: string;
  type: string;
  region_name: string | null;
  lon: number;
  lat: number;
}

interface AdminPlaceRow extends PlaceRow {
  status: string;
  description: string | null;
}

function slugify(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", " ": "-",
  };
  const transliterated = name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
  return (
    transliterated
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 7)
  );
}

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  // Повертає GeoJSON FeatureCollection — див. docs/api/openapi.yaml (GET /places)
  // Геометрія — PostGIS geography, недоступна для звичайного Prisma Client
  // (Unsupported("geography(...)")), тому працюємо через $queryRaw + ST_X/ST_Y.
  async list(layer?: string, bbox?: string) {
    const conditions: string[] = [`p.status = 'published'`, `p.geom_point IS NOT NULL`];
    const params: any[] = [];

    if (layer) {
      params.push(layer);
      conditions.push(`p.type = $${params.length}::"place_type"`);
    }

    if (bbox) {
      const parts = bbox.split(",").map(Number);
      if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
        const [minLon, minLat, maxLon, maxLat] = parts;
        params.push(minLon, minLat, maxLon, maxLat);
        conditions.push(
          `ST_Intersects(p.geom_point::geometry, ST_MakeEnvelope($${params.length - 3}, $${params.length - 2}, $${params.length - 1}, $${params.length}, 4326))`,
        );
      }
    }

    const where = conditions.join(" AND ");
    const rows = await this.prisma.$queryRawUnsafe<PlaceRow[]>(
      `SELECT p.id, p.name, p.type::text as type, r.name as region_name,
              ST_X(p.geom_point::geometry) as lon, ST_Y(p.geom_point::geometry) as lat
       FROM "place" p
       LEFT JOIN "region" r ON r.id = p.region_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT 500`,
      ...params,
    );

    return {
      type: "FeatureCollection",
      features: rows.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: {
          id: p.id,
          name: p.name,
          place_type: p.type,
          region_name: p.region_name,
        },
      })),
    };
  }

  // Повний список для адмінки — усі статуси, без bbox/geo-фільтра
  async adminList() {
    const rows = await this.prisma.$queryRawUnsafe<AdminPlaceRow[]>(
      `SELECT p.id, p.name, p.type::text as type, p.status, p.description, r.name as region_name,
              ST_X(p.geom_point::geometry) as lon, ST_Y(p.geom_point::geometry) as lat
       FROM "place" p
       LEFT JOIN "region" r ON r.id = p.region_id
       WHERE p.geom_point IS NOT NULL
       ORDER BY p.created_at DESC`,
    );
    return rows;
  }

  async create(dto: CreatePlaceDto, createdBy: string) {
    const slug = slugify(dto.name);
    const place = await this.prisma.place.create({
      data: {
        type: dto.type as PlaceType,
        name: dto.name,
        slug,
        description: dto.description,
        status: "published",
        createdBy,
      },
    });
    await this.prisma.$executeRawUnsafe(
      `UPDATE "place" SET "geom_point" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3::uuid`,
      dto.lon,
      dto.lat,
      place.id,
    );
    return { id: place.id, slug: place.slug };
  }

  async update(id: string, dto: UpdatePlaceDto) {
    const existing = await this.prisma.place.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "not_found", message: "Місце не знайдено" });

    await this.prisma.place.update({
      where: { id },
      data: {
        type: dto.type as PlaceType,
        name: dto.name,
        description: dto.description,
      },
    });

    if (dto.lon !== undefined && dto.lat !== undefined) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "place" SET "geom_point" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3::uuid`,
        dto.lon,
        dto.lat,
        id,
      );
    }
    return { id };
  }

  async remove(id: string) {
    const existing = await this.prisma.place.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "not_found", message: "Місце не знайдено" });
    await this.prisma.place.delete({ where: { id } });
    return { id, deleted: true };
  }
}
