import { SetMetadata } from "@nestjs/common";

// Ролі відповідають docs/db/schema.dbml (таблиця role):
// viewer | editor | moderator | archivist | verifier_gov | partner_curator | admin | superadmin
export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
