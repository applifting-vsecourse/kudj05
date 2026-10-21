import { ROLES_KEY } from '@/shared/auth/decorators/roles.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { hasRole, Role } from '@/shared/auth/domain/roles';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Runs after AuthenticatedUserGuard, which has already put the session on the request.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles) return true;

    const user: Identity | undefined = context.switchToHttp().getRequest()
      .session?.user;
    // 403: signed in, but not with a role this route allows
    if (!user || !hasRole(user, roles)) throw new ForbiddenException();
    return true;
  }
}
