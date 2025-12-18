import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { role?: string } }>();
    const user = request.user;
    if (
      !user ||
      typeof user.role !== 'string' ||
      !requiredRoles.includes(user.role)
    ) {
      throw new ForbiddenException(
        "Sizning bu amalni bajarishga ruxsatingiz yo'q",
      );
    }
    return true;
  }
}
