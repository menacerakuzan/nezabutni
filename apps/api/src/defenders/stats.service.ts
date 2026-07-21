import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [total, verified, pending, regions, units, places] = await Promise.all([
      this.prisma.defender.count({ where: { status: "published" } }),
      this.prisma.defender.count({ where: { status: "published", verificationStatus: "verified" } }),
      this.prisma.defender.count({ where: { status: "published", verificationStatus: "pending" } }),
      this.prisma.region.count(),
      this.prisma.unit.count(),
      this.prisma.place.count({ where: { status: "published" } }),
    ]);

    return { total, verified, pending, regions, units, places };
  }
}
