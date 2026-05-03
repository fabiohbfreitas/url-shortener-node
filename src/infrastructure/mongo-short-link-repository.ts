import { ShortLinkDocument } from "./db.js";
import type { IShortLinkRepository } from "./short-link-repository.js";

export class MongoShortLinkRepository implements IShortLinkRepository {
  constructor(private ShortLink: any) {}

  async createShortLink(
    slug: string,
    originalUrl: string,
    userId: string,
  ): Promise<ShortLinkDocument> {
    const shortLink = await this.ShortLink.insertOne({
      slug,
      originalUrl,
      userId,
      visits: 0,
    });
    return shortLink as ShortLinkDocument;
  }

  async findShortLinkBySlug(slug: string): Promise<ShortLinkDocument | null> {
    return await this.ShortLink.findOne({ slug });
  }

  async findShortLinkBySlugAndUserId(
    slug: string,
    userId: string,
  ): Promise<ShortLinkDocument | null> {
    return await this.ShortLink.findOne({ slug, userId });
  }

  async incrementVisits(slug: string): Promise<void> {
    await this.ShortLink.updateOne({ slug }, { $inc: { visits: 1 } });
  }

  async deleteShortLinkBySlugAndUserId(slug: string, userId: string): Promise<boolean> {
    const result = await this.ShortLink.deleteOne({ slug, userId });
    return result.deletedCount === 1;
  }

  async listShortLinksByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ShortLinkDocument[]; total: number }> {
    const cappedLimit = Math.min(limit, 50);
    const offset = (page - 1) * cappedLimit;

    const items = await this.ShortLink.find(
      { userId },
      {
        sort: { createdAt: -1 },
        skip: offset,
        limit: cappedLimit,
      },
    );

    const total = await this.ShortLink.countDocuments({ userId });

    return { items, total };
  }
}
