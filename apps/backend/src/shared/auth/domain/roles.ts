import { UserRole } from '@/generated/prisma/enums';
import { Identity } from '@/shared/auth/domain/identity';

export type Role = UserRole;

/** Roles that may delete any quack, not only their own. */
export const MODERATION_ROLES: readonly Role[] = ['admin', 'moderator'];

/** The role always comes from the session user, never from the request. */
export const hasRole = (user: Identity, roles: readonly Role[]): boolean =>
  roles.some((role) => role === user.role);
