import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Session, User, UserSystem } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { USER_SYSTEM } from '../naminto-core/naminto-core.module';
import { AuthController } from './auth.controller';
import { GoogleOAuthService } from './google-oauth.service';

const FAKE_USER: User = { id: 'u1', email: 'test@example.com', createdAt: '2026-08-21T00:00:00.000Z' };
const FAKE_SESSION: Session = {
  token: 'tok_1',
  userId: 'u1',
  expiresAt: '2026-08-28T00:00:00.000Z',
};

function fakeGoogleOAuth(overrides: Partial<GoogleOAuthService> = {}): Partial<GoogleOAuthService> {
  return {
    buildAuthorizationUrl: () => 'https://accounts.google.com/o/oauth2/v2/auth?fake=1',
    verifyState: () => true,
    exchangeCode: async () => ({ externalId: 'google-sub-1', email: 'test@example.com' }),
    ...overrides,
  };
}

async function buildController(
  userSystem: Partial<UserSystem>,
  googleOAuth: Partial<GoogleOAuthService> = fakeGoogleOAuth(),
): Promise<AuthController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: USER_SYSTEM, useValue: userSystem },
      { provide: GoogleOAuthService, useValue: googleOAuth },
    ],
  }).compile();

  return moduleRef.get(AuthController);
}

describe('AuthController', () => {
  describe('register', () => {
    it('registers a user with a valid email and password', async () => {
      const controller = await buildController({ register: async () => FAKE_USER });
      const user = await controller.register({ email: 'test@example.com', password: 'password123' });
      expect(user).toEqual(FAKE_USER);
    });

    it('rejects an invalid email', async () => {
      const controller = await buildController({});
      await expect(
        controller.register({ email: 'not-an-email', password: 'password123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a too-short password', async () => {
      const controller = await buildController({});
      await expect(
        controller.register({ email: 'test@example.com', password: 'short' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps a duplicate-email error to 409 Conflict', async () => {
      const controller = await buildController({
        register: async () => {
          throw new Error('LocalUserSystem: email "test@example.com" is already registered.');
        },
      });
      await expect(
        controller.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not mask an unrelated error as a conflict', async () => {
      const controller = await buildController({
        register: async () => {
          throw new Error('disk is full');
        },
      });
      await expect(
        controller.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.not.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a session for valid credentials', async () => {
      const controller = await buildController({ authenticate: async () => FAKE_SESSION });
      const session = await controller.login({ email: 'test@example.com', password: 'password123' });
      expect(session).toEqual(FAKE_SESSION);
    });

    it('maps invalid credentials to 401', async () => {
      const controller = await buildController({
        authenticate: async () => {
          throw new Error('LocalUserSystem: invalid email or password.');
        },
      });
      await expect(
        controller.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // The 401 cases (missing/malformed header, unknown/expired token) are
  // enforced by SessionAuthGuard, not this method — see
  // session-auth.guard.spec.ts. me() itself just echoes back whatever user
  // the guard already attached to the request.
  describe('me', () => {
    it('returns the current user', async () => {
      const controller = await buildController({});
      expect(controller.me(FAKE_USER)).toEqual(FAKE_USER);
    });
  });

  describe('googleLogin', () => {
    it('redirects to the URL built by GoogleOAuthService', async () => {
      const controller = await buildController(
        {},
        fakeGoogleOAuth({ buildAuthorizationUrl: () => 'https://accounts.google.com/fake-auth-url' }),
      );
      expect(controller.googleLogin()).toEqual({ url: 'https://accounts.google.com/fake-auth-url' });
    });
  });

  describe('googleCallback', () => {
    it('redirects with the session token in the URL fragment on success', async () => {
      const controller = await buildController(
        { authenticateExternal: async () => FAKE_SESSION },
        fakeGoogleOAuth(),
      );

      const result = await controller.googleCallback({ code: 'auth-code', state: 'valid-state' });

      expect(result).toEqual({ url: `http://localhost:3000/#token=${FAKE_SESSION.token}` });
    });

    it('redirects with an error when the state is missing', async () => {
      const controller = await buildController({}, fakeGoogleOAuth());
      const result = await controller.googleCallback({ code: 'auth-code' });
      expect(result.url).toContain('http://localhost:3000/?error=');
    });

    it('redirects with an error when the state is invalid', async () => {
      const controller = await buildController({}, fakeGoogleOAuth({ verifyState: () => false }));
      const result = await controller.googleCallback({ code: 'auth-code', state: 'bad-state' });
      expect(result.url).toContain('http://localhost:3000/?error=');
    });

    it('redirects with an error when the code exchange fails', async () => {
      const controller = await buildController(
        {},
        fakeGoogleOAuth({
          exchangeCode: async () => {
            throw new Error('token exchange failed');
          },
        }),
      );
      const result = await controller.googleCallback({ code: 'bad-code', state: 'valid-state' });
      expect(result.url).toContain('http://localhost:3000/?error=');
    });

    it('redirects with an error when authenticateExternal fails', async () => {
      const controller = await buildController(
        {
          authenticateExternal: async () => {
            throw new Error('boom');
          },
        },
        fakeGoogleOAuth(),
      );
      const result = await controller.googleCallback({ code: 'auth-code', state: 'valid-state' });
      expect(result.url).toContain('http://localhost:3000/?error=');
    });
  });
});
