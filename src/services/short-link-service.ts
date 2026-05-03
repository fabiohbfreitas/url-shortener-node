import type { ShortLinkDocument } from "../infrastructure/db.js";
import type { IShortLinkRepository } from "../infrastructure/short-link-repository.js";
import { generateUniqueSlug } from "../utils/slug.js";

export class ShortLinkService {
  constructor(private shortLinkRepo: IShortLinkRepository) {}

  async create(
    url: string,
    userId: string,
    protocol: string,
    host: string,
  ): Promise<{ slug: string; shortUrl: string; originalUrl: string }> {
    const slug = await generateUniqueSlug(async (s: string) => {
      const existing = await this.shortLinkRepo.findShortLinkBySlug(s);
      return !!existing;
    });

    await this.shortLinkRepo.createShortLink(slug, url, userId);

    const shortUrl = `${protocol}://${host}/${slug}`;

    return {
      slug,
      shortUrl,
      originalUrl: url,
    };
  }

  async list(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ShortLinkDocument[]; total: number }> {
    return await this.shortLinkRepo.listShortLinksByUserId(userId, page, limit);
  }

  async get(slug: string, userId: string): Promise<ShortLinkDocument | null> {
    return await this.shortLinkRepo.findShortLinkBySlugAndUserId(slug, userId);
  }

  async delete(slug: string, userId: string): Promise<boolean> {
    return await this.shortLinkRepo.deleteShortLinkBySlugAndUserId(slug, userId);
  }

  async redirect(slug: string): Promise<{ originalUrl: string } | { message: string; status: number }> {
    const shortLink = await this.shortLinkRepo.findShortLinkBySlug(slug);

    if (!shortLink) {
      return { message: "Short link not found", status: 404 };
    }

    await this.shortLinkRepo.incrementVisits(slug);

    return { originalUrl: shortLink.originalUrl };
  }
}
