import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { UserSystem } from '@namintoia/naminto-core';
import { USER_SYSTEM } from '../naminto-core/naminto-core.module';
import { extractBearerToken } from './bearer-token';

/** Attaches request.user from a verified session, or rejects with 401. */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(@Inject(USER_SYSTEM) private readonly userSystem: UserSystem) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers['authorization']);
    const user = await this.userSystem.verifySession(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    request.user = user;
    return true;
  }
}
