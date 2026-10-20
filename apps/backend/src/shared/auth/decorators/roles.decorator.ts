import { Role } from '@/shared/auth/domain/roles';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Only these roles may call the route. Needs `RolesGuard` after `AuthenticatedUserGuard`. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
