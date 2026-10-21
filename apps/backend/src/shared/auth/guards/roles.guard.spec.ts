import { Identity } from '@/shared/auth/domain/identity';
import { Role } from '@/shared/auth/domain/roles';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const contextFor = (user: Partial<Identity>): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ session: { user } }) }),
  }) as unknown as ExecutionContext;

const guardRequiring = (roles: Role[] | undefined): RolesGuard => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
  return new RolesGuard(reflector);
};

describe('RolesGuard', () => {
  it('lets an admin into an admin-only route', () => {
    const guard = guardRequiring(['admin']);

    expect(guard.canActivate(contextFor({ role: 'admin' }))).toBe(true);
  });

  it.each(['user', 'moderator'])('refuses a %s with 403', (role) => {
    const guard = guardRequiring(['admin']);

    expect(() => guard.canActivate(contextFor({ role }))).toThrow(
      ForbiddenException,
    );
  });

  it('leaves routes without @Roles alone', () => {
    const guard = guardRequiring(undefined);

    expect(guard.canActivate(contextFor({ role: 'user' }))).toBe(true);
  });
});
