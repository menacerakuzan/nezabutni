import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { generateDefenderPid } from "../common/pid.util";

interface QueueItem {
  id: string;
  entity_type: "memory_ugc" | "defender_submission";
  entity_id: string;
  preview: string;
  submitted_by: string;
  ai_flags: string[];
  created_at: Date;
}

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  // Єдина черга модерації — docs/prd/05-cms-moderation.md, п. 3.3
  async queue(entityType?: string, limit = 20) {
    const items: QueueItem[] = [];

    if (!entityType || entityType === "memory_ugc") {
      const memories = await this.prisma.memoryUgc.findMany({
        where: { status: "pending" },
        include: { author: true },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      items.push(
        ...memories.map((m) => ({
          id: m.id,
          entity_type: "memory_ugc" as const,
          entity_id: m.id,
          preview: m.body.slice(0, 120),
          submitted_by: m.author.displayName,
          ai_flags: [],
          created_at: m.createdAt,
        })),
      );
    }

    if (!entityType || entityType === "defender_submission") {
      const submissions = await this.prisma.defenderSubmission.findMany({
        where: { status: "pending" },
        include: { submitter: true },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      items.push(
        ...submissions.map((s) => ({
          id: s.id,
          entity_type: "defender_submission" as const,
          entity_id: s.id,
          preview: JSON.stringify(s.payload).slice(0, 120),
          submitted_by: s.submitter.displayName,
          ai_flags: [],
          created_at: s.createdAt,
        })),
      );
    }

    items.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

    return { items: items.slice(0, limit), next_cursor: null, total_estimate: items.length };
  }

  async decide(id: string, decision: "approve" | "reject", moderatorUserId: string, reason?: string) {
    const memory = await this.prisma.memoryUgc.findUnique({ where: { id } });
    if (memory) {
      const updated = await this.prisma.memoryUgc.update({
        where: { id },
        data: {
          status: decision === "approve" ? "approved" : "rejected",
          moderatedBy: moderatorUserId,
          moderatedAt: new Date(),
          rejectionReason: decision === "reject" ? reason : null,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          actorId: moderatorUserId,
          action: `moderation.memory_ugc.${decision}`,
          entityType: "memory_ugc",
          entityId: id,
        },
      });
      return { entityType: "memory_ugc", id: updated.id, status: updated.status };
    }

    const submission = await this.prisma.defenderSubmission.findUnique({ where: { id } });
    if (submission) {
      // Схвалення саме по собі раніше лише міняло статус заявки — сам
      // захисник ніколи не з'являвся в реєстрі. Тепер при "approve"
      // дійсно створюємо (або оновлюємо) запис defender із payload.
      const defenderId =
        decision === "approve" ? await this.applySubmission(submission, moderatorUserId) : submission.defenderId;

      const updated = await this.prisma.defenderSubmission.update({
        where: { id },
        data: {
          status: decision === "approve" ? "approved" : "rejected",
          decisionNote: reason,
          decidedAt: new Date(),
          defenderId,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          actorId: moderatorUserId,
          action: `moderation.defender_submission.${decision}`,
          entityType: "defender_submission",
          entityId: id,
        },
      });
      return { entityType: "defender_submission", id: updated.id, status: updated.status, defenderId };
    }

    throw new NotFoundException({ code: "not_found", message: "Елемент черги не знайдено" });
  }

  /** Створює нового захисника з payload заявки або оновлює вже пов'язаного. */
  private async applySubmission(
    submission: { id: string; defenderId: string | null; payload: unknown; submittedBy: string },
    actorId: string,
  ): Promise<string> {
    const payload = (submission.payload ?? {}) as Record<string, unknown>;
    const fullName = String(payload.fullName ?? "").trim();
    const birthPlace = payload.birthPlace ? String(payload.birthPlace).trim() : null;

    const data = {
      fullName,
      fullNameNormalized: fullName.toLowerCase(),
      birthDate: payload.birthDate ? new Date(String(payload.birthDate)) : null,
      deathDate: payload.deathDate ? new Date(String(payload.deathDate)) : null,
      status: "published" as const,
      verificationStatus: "verified" as const,
      verifiedBy: actorId,
      verifiedAt: new Date(),
    };

    if (submission.defenderId) {
      await this.prisma.defender.update({ where: { id: submission.defenderId }, data });
      return submission.defenderId;
    }

    const pid = await generateDefenderPid(this.prisma);
    const defender = await this.prisma.defender.create({
      data: {
        pid,
        ...data,
        bio: birthPlace ? `Місце народження: ${birthPlace}` : null,
        createdBy: submission.submittedBy,
      },
    });
    return defender.id;
  }
}
