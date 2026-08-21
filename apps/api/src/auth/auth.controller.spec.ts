import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Session, User, UserSystem } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { USER_SYSTEM } from '../naminto-core/naminto-core.module';
import { AuthController } from './auth.controller';

const FAKE_USER: User = { id: 'u1', email: 'test@example.com', createdAt: '2026-08-21T00:00:00.000Z' };
const FAKE_SESSION: Session = {
  token: 'tok_1',
  userId: 'u1',
  expiresAt: '2026-08-28T00:00:00.000Z',
};

async function buildController(userSystem: Partial<UserSystem>): Promise<AuthController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: USER_SYSTEM, useValue: userSystem }],
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
});
