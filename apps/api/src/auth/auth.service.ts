import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import { hashPassword, verifyPassword } from "../common/password.util";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export interface JwtPayload {
  sub: string;
  email: string | null;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private async issueToken(userId: string, email: string | null, roles: string[]) {
    const payload: JwtPayload = { sub: userId, email, roles };
    return this.jwt.signAsync(payload);
  }

  private async rolesFor(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.code);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.appUser.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ code: "email_taken", message: "Ця пошта вже зареєстрована" });
    }

    const user = await this.prisma.appUser.create({
      data: {
        authSubject: `local:${dto.email}`,
        email: dto.email,
        displayName: dto.displayName,
        passwordHash: hashPassword(dto.password),
        status: "active",
      },
    });

    // Кожен новий користувач отримує базову роль viewer (id=1, docs/db/schema.dbml)
    await this.prisma.userRole.create({ data: { userId: user.id, roleId: 1 } });

    const token = await this.issueToken(user.id, user.email, ["viewer"]);
    return { accessToken: token, user: { id: user.id, email: user.email, displayName: user.displayName } };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.appUser.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException({ code: "invalid_credentials", message: "Невірна пошта або пароль" });
    }
    if (user.status !== "active") {
      throw new UnauthorizedException({ code: "account_disabled", message: "Обліковий запис заблоковано" });
    }

    const roles = await this.rolesFor(user.id);
    const token = await this.issueToken(user.id, user.email, roles);
    return { accessToken: token, user: { id: user.id, email: user.email, displayName: user.displayName, roles } };
  }

  async me(userId: string) {
    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const roles = await this.rolesFor(user.id);
    return { id: user.id, email: user.email, displayName: user.displayName, roles };
  }
}
