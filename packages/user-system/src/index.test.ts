import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalUserSystem } from './index.js';

describe('LocalUserSystem', () => {
  let baseDir: string;
  let userSystem: LocalUserSystem;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'naminto-users-'));
    userSystem = new LocalUserSystem({ baseDir });
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('registers a user and never stores the password in plain text', async () => {
    const user = await userSystem.register('Alice@Example.com', 'correct horse battery staple');

    expect(user.email).toBe('alice@example.com');
    expect(user.id).toBeTruthy();
    expect(user.createdAt).toBeTruthy();

    const raw = await readFile(join(baseDir, 'users.json'), 'utf8');
    expect(raw).not.toContain('correct horse battery staple');
  });

  it('rejects a duplicate email, case-insensitively', async () => {
    await userSystem.register('bob@example.com', 'password123');
    await expect(userSystem.register('Bob@Example.com', 'somethingElse1')).rejects.toThrow(
      /already registered/,
    );
  });

  it('authenticates with the correct password and returns a session', async () => {
    await userSystem.register('carol@example.com', 'password123');
    const session = await userSystem.authenticate('carol@example.com', 'password123');

    expect(session.token).toBeTruthy();
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects the wrong password with a generic message', async () => {
    await userSystem.register('dave@example.com', 'password123');
    await expect(userSystem.authenticate('dave@example.com', 'wrongpassword')).rejects.toThrow(
      /invalid email or password/,
    );
  });

  it('rejects an unknown email with the same generic message (no user enumeration)', async () => {
    await expect(userSystem.authenticate('nobody@example.com', 'whatever1')).rejects.toThrow(
      /invalid email or password/,
    );
  });

  it('verifies a valid session token and returns the matching user', async () => {
    const user = await userSystem.register('erin@example.com', 'password123');
    const session = await userSystem.authenticate('erin@example.com', 'password123');

    const verified = await userSystem.verifySession(session.token);

    expect(verified).toEqual(user);
  });

  it('returns null for an unknown session token', async () => {
    expect(await userSystem.verifySession('does-not-exist')).toBeNull();
  });

  it('returns null for an expired session token', async () => {
    await userSystem.register('frank@example.com', 'password123');
    const session = await userSystem.authenticate('frank@example.com', 'password123');

    const sessionsPath = join(baseDir, 'sessions.json');
    const sessions = JSON.parse(await readFile(sessionsPath, 'utf8')) as { token: string; expiresAt: string }[];
    const expired = sessions.map((s) => ({ ...s, expiresAt: new Date(Date.now() - 1000).toISOString() }));
    await writeFile(sessionsPath, JSON.stringify(expired), 'utf8');

    expect(await userSystem.verifySession(session.token)).toBeNull();
  });

  it('does not lose registrations made concurrently', async () => {
    await Promise.all([
      userSystem.register('a@example.com', 'password123'),
      userSystem.register('b@example.com', 'password123'),
      userSystem.register('c@example.com', 'password123'),
    ]);

    const raw = await readFile(join(baseDir, 'users.json'), 'utf8');
    const users = JSON.parse(raw) as { email: string }[];
    expect(users.map((u) => u.email).sort()).toEqual(['a@example.com', 'b@example.com', 'c@example.com']);
  });

  describe('authenticateExternal', () => {
    it('creates a new account from an external identity and returns a session', async () => {
      const session = await userSystem.authenticateExternal({
        provider: 'google',
        externalId: 'google-sub-1',
        email: 'Grace@Example.com',
      });

      expect(session.token).toBeTruthy();
      const user = await userSystem.verifySession(session.token);
      expect(user?.email).toBe('grace@example.com');
    });

    it('links to an existing password account by email, case-insensitively', async () => {
      const existing = await userSystem.register('heidi@example.com', 'password123');

      const session = await userSystem.authenticateExternal({
        provider: 'google',
        externalId: 'google-sub-2',
        email: 'Heidi@Example.com',
      });

      const user = await userSystem.verifySession(session.token);
      expect(user?.id).toBe(existing.id);
    });

    it('lets a linked account still authenticate with its original password', async () => {
      await userSystem.register('ivan@example.com', 'password123');
      await userSystem.authenticateExternal({
        provider: 'google',
        externalId: 'google-sub-3',
        email: 'ivan@example.com',
      });

      const session = await userSystem.authenticate('ivan@example.com', 'password123');
      expect(session.token).toBeTruthy();
    });

    it('rejects any password for a Google-only account', async () => {
      await userSystem.authenticateExternal({
        provider: 'google',
        externalId: 'google-sub-4',
        email: 'judy@example.com',
      });

      await expect(userSystem.authenticate('judy@example.com', 'whatever1')).rejects.toThrow(
        /invalid email or password/,
      );
    });

    it('does not duplicate a user for concurrent external logins with the same new email', async () => {
      await Promise.all([
        userSystem.authenticateExternal({ provider: 'google', externalId: 'g1', email: 'ken@example.com' }),
        userSystem.authenticateExternal({ provider: 'google', externalId: 'g1', email: 'ken@example.com' }),
        userSystem.authenticateExternal({ provider: 'google', externalId: 'g1', email: 'ken@example.com' }),
      ]);

      const raw = await readFile(join(baseDir, 'users.json'), 'utf8');
      const users = JSON.parse(raw) as { email: string }[];
      expect(users.filter((u) => u.email === 'ken@example.com')).toHaveLength(1);
    });
  });
});
