import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubmissionDto, userId: string) {
    // Згода обов'язкова юридично — docs/prd/01-defenders-registry.md, п. 3.4
    if (!dto.consent.publishData || !dto.consent.processPii) {
      throw new BadRequestException({
        code: "consent_required",
        message: "Потрібна згода на публікацію даних і обробку персональних даних",
      });
    }

    let defenderId: string | undefined;
    if (dto.defenderPid) {
      const existing = await this.prisma.defender.findUnique({ where: { pid: dto.defenderPid } });
      defenderId = existing?.id;
    }

    const submission = await this.prisma.defenderSubmission.create({
      data: {
        submittedBy: userId,
        defenderId,
        payload: dto.payload as any,
        attachedMediaIds: dto.attachedMediaIds ?? [],
        status: "pending",
      },
    });

    await this.prisma.consentRecord.createMany({
      data: [
        { userId, defenderId, consentType: "publish_data", granted: dto.consent.publishData },
        { userId, defenderId, consentType: "publish_media", granted: !!dto.consent.publishMedia },
        { userId, defenderId, consentType: "process_pii", granted: dto.consent.processPii },
      ],
    });

    return { id: submission.id, status: submission.status, createdAt: submission.createdAt };
  }

  async listMine(userId: string) {
    const items = await this.prisma.defenderSubmission.findMany({
      where: { submittedBy: userId },
      orderBy: { createdAt: "desc" },
    });
    return items.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      decidedAt: s.decidedAt,
      decisionNote: s.decisionNote,
    }));
  }
}
