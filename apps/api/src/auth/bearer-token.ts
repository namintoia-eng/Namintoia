import { UnauthorizedException } from '@nestjs/common';

const BEARER_PREFIX = 'Bearer ';

export function extractBearerToken(authorization: string | undefined): string {
  if (!authorization || !authorization.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedException('Missing or malformed Authorization header.');
  }
  return authorization.slice(BEARER_PREFIX.length);
}
