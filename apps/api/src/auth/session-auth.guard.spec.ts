import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { User, UserSystem } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { SessionAuthGuard } from './session-auth.guard';

const FAKE_USER: User = { id: 'u1', email: 'test@example.com', createdAt: '2026-08-21T00:00:00.000Z' };

function fakeUserSystem(verifySession: UserSystem['verifySession']): UserSystem {
  return {
    name: 'fake',
    register: async () => FAKE_USER,
    authenticate: async () => {
      throw new Error('not used in these tests');
    },
    authenticateExternal: async () => {
      throw new Error('not used in these tests');
    },
    verifySession,
  };
}

function fakeContext(
  authorization: string | undefined,
): { context: ExecutionContext; request: Record<string, unknown> } {
  const request: Record<string, unknown> = { headers: { authorization } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('SessionAuthGuard', () => {
  it('rejects a missing Authorization header', async () => {
    const guard = new SessionAuthGuard(fakeUserSystem(async () => FAKE_USER));
    const { context } = fakeContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token that does not resolve to a user', async () => {
    const guard = new SessionAuthGuard(fakeUserSystem(async () => null));
    const { context } = fakeContext('Bearer some-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a valid token and attaches the user to the request', async () => {
    const guard = new SessionAuthGuard(fakeUserSystem(async () => FAKE_USER));
    const { context, request } = fakeContext('Bearer valid-token');

    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(request['user']).toEqual(FAKE_USER);
  });
});
