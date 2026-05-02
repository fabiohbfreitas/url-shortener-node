import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod/v4";

export type { DatabaseSync };

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);

const DB_PATH = join(currentDirname, "../data/urls.db");

let db: DatabaseSync | null = null;

export const getDatabase = (): DatabaseSync => {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    initializeDatabase(db);
  }
  return db;
};

export const getTestDatabase = (): DatabaseSync => {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
};

export const initializeDatabase = (database: DatabaseSync): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_auth_codes_user_id ON auth_codes(user_id)
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS short_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      visits INTEGER DEFAULT 0
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_slug ON short_links(slug)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_short_links_user_id ON short_links(user_id)
  `);
};

export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string(),
  last_login_at: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthCodeSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  code: z.string().min(1),
  expires_at: z.string(),
  used_at: z.string().nullable(),
  created_at: z.string(),
});

export type AuthCode = z.infer<typeof AuthCodeSchema>;

export const findOrCreateUser = (database: DatabaseSync, email: string): User => {
  const findStmt = database.prepare(`
    SELECT id, email, created_at, updated_at, last_login_at
    FROM users
    WHERE email = ?
  `);

  const existing = findStmt.get(email) as
    | {
        id: number;
        email: string;
        created_at: string;
        updated_at: string;
        last_login_at: string | null;
      }
    | undefined;

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
      last_login_at: existing.last_login_at,
    };
  }

  const insertStmt = database.prepare(`
    INSERT INTO users (email) VALUES (?)
  `);

  const result = insertStmt.run(email);

  return {
    id: Number(result.lastInsertRowid),
    email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: null,
  };
};

export const updateUserLastLogin = (database: DatabaseSync, userId: number): void => {
  const stmt = database.prepare(`
    UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(userId);
};

export const createAuthCode = (
  database: DatabaseSync,
  userId: number,
  code: string,
  expiresAt: string,
): AuthCode => {
  const stmt = database.prepare(`
    INSERT INTO auth_codes (user_id, code, expires_at) VALUES (?, ?, ?)
  `);

  const result = stmt.run(userId, code, expiresAt);

  return {
    id: Number(result.lastInsertRowid),
    user_id: userId,
    code,
    expires_at: expiresAt,
    used_at: null,
    created_at: new Date().toISOString(),
  };
};

export const findValidAuthCode = (
  database: DatabaseSync,
  email: string,
  code: string,
): (AuthCode & { email: string }) | undefined => {
  const stmt = database.prepare(`
    SELECT ac.id, ac.user_id, ac.code, ac.expires_at, ac.used_at, ac.created_at, u.email
    FROM auth_codes ac
    JOIN users u ON u.id = ac.user_id
    WHERE u.email = ? AND ac.code = ? AND ac.used_at IS NULL AND ac.expires_at > CURRENT_TIMESTAMP
  `);

  const row = stmt.get(email, code) as
    | {
        id: number;
        user_id: number;
        code: string;
        expires_at: string;
        used_at: string | null;
        created_at: string;
        email: string;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    code: row.code,
    expires_at: row.expires_at,
    used_at: row.used_at,
    created_at: row.created_at,
    email: row.email,
  };
};

export const markAuthCodeUsed = (database: DatabaseSync, codeId: number): void => {
  const stmt = database.prepare(`
    UPDATE auth_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(codeId);
};

export const findUserById = (database: DatabaseSync, id: number): User | undefined => {
  const stmt = database.prepare(`
    SELECT id, email, created_at, updated_at, last_login_at
    FROM users
    WHERE id = ?
  `);

  const row = stmt.get(id) as
    | {
        id: number;
        email: string;
        created_at: string;
        updated_at: string;
        last_login_at: string | null;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: row.last_login_at,
  };
};

export const ShortLinkSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  original_url: z.string().url(),
  user_id: z.number().int().positive(),
  created_at: z.string(),
  visits: z.number().int().min(0),
});

export type ShortLink = z.infer<typeof ShortLinkSchema>;

export const createShortLink = (
  database: DatabaseSync,
  slug: string,
  originalUrl: string,
  userId: number,
): ShortLink => {
  const stmt = database.prepare(`
    INSERT INTO short_links (slug, original_url, user_id) VALUES (?, ?, ?)
  `);

  const result = stmt.run(slug, originalUrl, userId);

  return {
    id: Number(result.lastInsertRowid),
    slug,
    original_url: originalUrl,
    user_id: userId,
    created_at: new Date().toISOString(),
    visits: 0,
  };
};

export const findShortLinkBySlug = (
  database: DatabaseSync,
  slug: string,
): ShortLink | undefined => {
  const stmt = database.prepare(`
    SELECT id, slug, original_url, user_id, created_at, visits
    FROM short_links
    WHERE slug = ?
  `);

  const row = stmt.get(slug) as
    | {
        id: number;
        slug: string;
        original_url: string | number;
        user_id: number;
        created_at: string;
        visits: number;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    slug: row.slug,
    original_url: String(row.original_url),
    user_id: row.user_id,
    created_at: row.created_at,
    visits: row.visits,
  };
};

export const incrementVisits = (database: DatabaseSync, slug: string): void => {
  const stmt = database.prepare(`
    UPDATE short_links SET visits = visits + 1 WHERE slug = ?
  `);
  stmt.run(slug);
};

export const deleteShortLink = (database: DatabaseSync, slug: string): boolean => {
  const stmt = database.prepare(`
    DELETE FROM short_links WHERE slug = ?
  `);
  const result = stmt.run(slug);
  return result.changes > 0;
};

export const invalidateUserAuthCodes = (database: DatabaseSync, userId: number): void => {
  const stmt = database.prepare(`
    UPDATE auth_codes SET used_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND used_at IS NULL
  `);
  stmt.run(userId);
};

export const listShortLinksByUserId = (
  database: DatabaseSync,
  userId: number,
  page: number = 1,
  limit: number = 10,
): { items: ShortLink[]; total: number } => {
  const countStmt = database.prepare(`
    SELECT COUNT(*) as total FROM short_links WHERE user_id = ?
  `);
  const { total } = countStmt.get(userId) as { total: number };

  const offset = (page - 1) * limit;
  const listStmt = database.prepare(`
    SELECT id, slug, original_url, user_id, created_at, visits
    FROM short_links
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows = listStmt.all(userId, limit, offset) as Array<{
    id: number;
    slug: string;
    original_url: string | number;
    user_id: number;
    created_at: string;
    visits: number;
  }>;

  const items = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    original_url: String(row.original_url),
    user_id: row.user_id,
    created_at: row.created_at,
    visits: row.visits,
  }));

  return { items, total };
};

export const findShortLinkBySlugAndUserId = (
  database: DatabaseSync,
  slug: string,
  userId: number,
): ShortLink | undefined => {
  const stmt = database.prepare(`
    SELECT id, slug, original_url, user_id, created_at, visits
    FROM short_links
    WHERE slug = ? AND user_id = ?
  `);

  const row = stmt.get(slug, userId) as
    | {
        id: number;
        slug: string;
        original_url: string | number;
        user_id: number;
        created_at: string;
        visits: number;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    slug: row.slug,
    original_url: String(row.original_url),
    user_id: row.user_id,
    created_at: row.created_at,
    visits: row.visits,
  };
};

export const deleteShortLinkBySlugAndUserId = (
  database: DatabaseSync,
  slug: string,
  userId: number,
): boolean => {
  const stmt = database.prepare(`
    DELETE FROM short_links WHERE slug = ? AND user_id = ?
  `);
  const result = stmt.run(slug, userId);
  return result.changes > 0;
};
