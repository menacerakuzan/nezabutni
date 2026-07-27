import { PrismaService } from "../prisma.service";

/** PID захисника у форматі MEM-{рік}-{порядковий номер}, напр. MEM-2026-000105. */
export async function generateDefenderPid(prisma: PrismaService): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.defender.count();
  for (let attempt = 0; attempt < 5; attempt++) {
    const pid = `MEM-${year}-${String(count + 1 + attempt).padStart(6, "0")}`;
    const exists = await prisma.defender.findUnique({ where: { pid }, select: { id: true } });
    if (!exists) return pid;
  }
  throw new Error("Не вдалося згенерувати унікальний PID захисника");
}
