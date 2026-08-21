import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@namintoia/naminto-core';

/** Reads the User that SessionAuthGuard attached to the request. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
