import type { DatabaseSync } from "../infrastructure/database.js";
import type { ShortLink } from "../domain/short-link.js";
import {
  createShortLink,
  findShortLinkBySlug,
  findShortLinkBySlugAndUserId,
  incrementVisits,
  deleteShortLinkBySlugAndUserId,
  listShortLinksByUserId,
} from "../infrastructure/database.js";
import { generateUniqueSlug } from "../utils/slug.js";

export class ShortLinkService {
  constructor(private db: DatabaseSync) {}

  create(
    url: string,
    userId: number,
    protocol: string,
    host: string,
  ): { slug: string; shortUrl: string; originalUrl: string } {
    const slug = generateUniqueSlug((s: string) => {
      const existing = findShortLinkBySlug(this.db, s);
      return existing !== undefined;
    });

    const shortLink = createShortLink(this.db, slug, url, userId);

    const shortUrl = `${protocol}://${host}/${slug}`;

    return {
      slug: shortLink.slug,
      shortUrl,
      originalUrl: shortLink.original_url,
    };
  }

  list(userId: number, page: number, limit: number): { items: ShortLink[]; total: number } {
    const cappedLimit = Math.min(limit, 50);
    return listShortLinksByUserId(this.db, userId, page, cappedLimit);
  }

  get(slug: string, userId: number): ShortLink | undefined {
    return findShortLinkBySlugAndUserId(this.db, slug, userId);
  }

  delete(slug: string, userId: number): boolean {
    return deleteShortLinkBySlugAndUserId(this.db, slug, userId);
  }

  redirect(slug: string): { originalUrl: string } | { message: string; status: number } {
    const shortLink = findShortLinkBySlug(this.db, slug);

    if (!shortLink) {
      return { message: "Short link not found", status: 404 };
    }

    incrementVisits(this.db, slug);

    return { originalUrl: shortLink.original_url as string };
  }
}
