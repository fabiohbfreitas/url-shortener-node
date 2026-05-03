import type { ShortLinkDocument } from "./db.js";

export interface IShortLinkRepository {
  createShortLink(slug: string, originalUrl: string, userId: string): Promise<ShortLinkDocument>;
  findShortLinkBySlug(slug: string): Promise<ShortLinkDocument | null>;
  findShortLinkBySlugAndUserId(slug: string, userId: string): Promise<ShortLinkDocument | null>;
  incrementVisits(slug: string): Promise<void>;
  deleteShortLinkBySlugAndUserId(slug: string, userId: string): Promise<boolean>;
  listShortLinksByUserId(userId: string, page: number, limit: number): Promise<{ items: ShortLinkDocument[]; total: number }>;
}
