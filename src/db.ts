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
  return new DatabaseSync(":memory:");
};

export const initializeDatabase = (database: DatabaseSync): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS short_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      visits INTEGER DEFAULT 0
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_slug ON short_links(slug)
  `);
};

export const ShortLinkSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  original_url: z.string().url(),
  created_at: z.string(),
  visits: z.number().int().min(0),
});

export type ShortLink = z.infer<typeof ShortLinkSchema>;

export const createShortLink = (
  database: DatabaseSync,
  slug: string,
  originalUrl: string,
): ShortLink => {
  const stmt = database.prepare(`
    INSERT INTO short_links (slug, original_url) VALUES (?, ?)
  `);

  const result = stmt.run(slug, originalUrl);

  return {
    id: Number(result.lastInsertRowid),
    slug,
    original_url: originalUrl,
    created_at: new Date().toISOString(),
    visits: 0,
  };
};

export const findShortLinkBySlug = (
  database: DatabaseSync,
  slug: string,
): ShortLink | undefined => {
  const stmt = database.prepare(`
    SELECT id, slug, original_url, created_at, visits
    FROM short_links
    WHERE slug = ?
  `);

  const row = stmt.get(slug) as
    | {
        id: number;
        slug: string;
        original_url: string | number;
        created_at: string;
        visits: number;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    slug: row.slug,
    original_url: String(row.original_url),
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
