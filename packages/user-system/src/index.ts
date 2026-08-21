import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Session, User, UserSystem } from '@namintoia/naminto-core';

const scrypt = promisify(scryptCallback);

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_KEYLEN = 64;
const INVALID_CREDENTIALS_MESSAGE = 'LocalUserSystem: invalid email or password.';

interface StoredUser {
  id: string;
  email: string;
  createdAt: string;
  passwordHash: string;
  passwordSalt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface LocalUserSystemConfig {
  baseDir?: string;
}

/**
 * Default UserSystem adapter (DECISIONS.md D-13 MVP): file-based accounts
 * with scrypt-hashed passwords and opaque session tokens — no external
 * identity provider required, same "don't block on infra that isn't
 * provisioned yet" reasoning as Memory System (D-10) and File System
 * (D-12). Writes are serialized through one in-process queue (covers both
 * users.json and sessions.json) to avoid read-modify-write races between
 * near-simultaneous registrations or logins.
 */
export class LocalUserSystem implements UserSystem {
  readonly name = 'local';

  private readonly baseDir: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(config: LocalUserSystemConfig = {}) {
    this.baseDir = config.baseDir ?? process.env['USER_SYSTEM_DIR'] ?? '.naminto/users';
  }

  async register(email: string, password: string): Promise<User> {
    return this.runExclusive(async () => {
      const normalizedEmail = normalizeEmail(email);
      const users = await this.readJson<StoredUser>('users.json');

      if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error(`LocalUserSystem: email "${normalizedEmail}" is already registered.`);
      }

      const passwordSalt = randomBytes(16).toString('hex');
      const stored: StoredUser = {
        id: randomUUID(),
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
        passwordHash: await hashPassword(password, passwordSalt),
        passwordSalt,
      };

      users.push(stored);
      await this.writeJson('users.json', users);

      return toPublicUser(stored);
    });
  }

  async authenticate(email: string, password: string): Promise<Session> {
    const normalizedEmail = normalizeEmail(email);
    const users = await this.readJson<StoredUser>('users.json');
    const stored = users.find((user) => user.email === normalizedEmail);

    if (!stored || !(await passwordMatches(password, stored))) {
      throw new Error(INVALID_CREDENTIALS_MESSAGE);
    }

    const session: StoredSession = {
      token: randomUUID(),
      userId: stored.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    return this.runExclusive(async () => {
      const sessions = await this.readJson<StoredSession>('sessions.json');
      sessions.push(session);
      await this.writeJson('sessions.json', sessions);
      return session;
    });
  }

  async verifySession(token: string): Promise<User | null> {
    const sessions = await this.readJson<StoredSession>('sessions.json');
    const session = sessions.find((s) => s.token === token);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }

    const users = await this.readJson<StoredUser>('users.json');
    const stored = users.find((user) => user.id === session.userId);
    return stored ? toPublicUser(stored) : null;
  }

  private runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async readJson<T>(filename: string): Promise<T[]> {
    try {
      const raw = await readFile(join(this.baseDir, filename), 'utf8');
      return JSON.parse(raw) as T[];
    } catch (error) {
      if (isNotFoundError(error)) {
        return [];
      }
      throw error;
    }
  }

  private async writeJson<T>(filename: string, data: T[]): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(join(this.baseDir, filename), JSON.stringify(data, null, 2), 'utf8');
  }
}

async function passwordMatches(password: string, stored: StoredUser): Promise<boolean> {
  const candidateHash = await hashPassword(password, stored.passwordSalt);
  const storedBuf = Buffer.from(stored.passwordHash, 'hex');
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  return storedBuf.length === candidateBuf.length && timingSafeEqual(storedBuf, candidateBuf);
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  const derivedKey = (await scrypt(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN)) as Buffer;
  return derivedKey.toString('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toPublicUser(stored: StoredUser): User {
  return { id: stored.id, email: stored.email, createdAt: stored.createdAt };
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'ENOENT'
  );
}
