import { describe, it, expect, vi } from "vitest";
import { hashPassword, verifyPassword } from "../src/common/password.util";
import { RolesGuard } from "../src/auth/roles.guard";
import { ForbiddenException } from "@nestjs/common";

describe("паролі", () => {
  it("правильний пароль проходить перевірку", () => {
    const stored = hashPassword("family12345");
    expect(verifyPassword("family12345", stored)).toBe(true);
  });

  it("невірний пароль не проходить", () => {
    const stored = hashPassword("family12345");
    expect(verifyPassword("family12346", stored)).toBe(false);
  });

  it("однаковий пароль дає різні хеші (унікальна сіль)", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });

  it("пошкоджений запис не валить процес", () => {
    expect(verifyPassword("x", "сміття-без-двокрапки")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("RolesGuard (RBAC)", () => {
  const ctx = (roles: string[]) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user: { roles } }) }),
      getHandler: () => null,
      getClass: () => null,
    }) as never;

  const guardWith = (required: string[] | undefined) =>
    new RolesGuard({ getAllAndOverride: () => required } as never);

  it("пропускає, коли ролі не вимагаються", () => {
    expect(guardWith(undefined).canActivate(ctx([]))).toBe(true);
  });

  it("пропускає власника потрібної ролі", () => {
    expect(guardWith(["moderator"]).canActivate(ctx(["moderator"]))).toBe(true);
  });

  it("superadmin проходить будь-яку перевірку", () => {
    expect(guardWith(["admin"]).canActivate(ctx(["superadmin"]))).toBe(true);
  });

  it("відмовляє користувачу без ролі", () => {
    expect(() => guardWith(["admin"]).canActivate(ctx(["family"]))).toThrow(ForbiddenException);
  });

  it("відмовляє анонімному запиту", () => {
    const anon = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
      getHandler: () => null,
      getClass: () => null,
    } as never;
    expect(() => guardWith(["admin"]).canActivate(anon)).toThrow(ForbiddenException);
  });
});
