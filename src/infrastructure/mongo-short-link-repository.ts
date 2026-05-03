import { ShortLinkDocument } from "./db.js";
import type { IShortLinkRepository } from "./short-link-repository.js";
import type { Collection } from "mongodb";

export class MongoShortLinkRepository implements IShortLinkRepository {
  constructor(private shortLinkCollection: Collection) {}

  async createShortLink(
    slug: string,
    originalUrl: string,
    userId: string,
  ): Promise<ShortLinkDocument> {
    const now = new Date();
    const result = await this.shortLinkCollection.insertOne({
      slug,
      originalUrl,
      userId,
      visits: 0,
      createdAt: now,
      updatedAt: now,
    });
    return {
      _id: result.insertedId.toString(),
      slug,
      originalUrl,
      userId,
      visits: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findShortLinkBySlug(slug: string): Promise<ShortLinkDocument | null> {
    const shortLink = await this.shortLinkCollection.findOne({ slug });
    if (!shortLink) return null;
    return { ...shortLink, _id: shortLink._id.toString() } as ShortLinkDocument;
  }

  async findShortLinkBySlugAndUserId(
    slug: string,
    userId: string,
  ): Promise<ShortLinkDocument | null> {
    const shortLink = await this.shortLinkCollection.findOne({ slug, userId });
    if (!shortLink) return null;
    return { ...shortLink, _id: shortLink._id.toString() } as ShortLinkDocument;
  }

  async incrementVisits(slug: string): Promise<void> {
    await this.shortLinkCollection.updateOne(
      { slug },
      { $inc: { visits: 1 }, $set: { updatedAt: new Date() } },
    );
  }

  async deleteShortLinkBySlugAndUserId(slug: string, userId: string): Promise<boolean> {
    const result = await this.shortLinkCollection.deleteOne({ slug, userId });
    return result.deletedCount === 1;
  }

  async listShortLinksByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ShortLinkDocument[]; total: number }> {
    const cappedLimit = Math.min(limit, 50);
    const offset = (page - 1) * cappedLimit;

    const items = await this.shortLinkCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(cappedLimit)
      .toArray();

    const total = await this.shortLinkCollection.countDocuments({ userId });

    return {
      items: items.map((item) => ({ ...item, _id: item._id.toString() })) as ShortLinkDocument[],
      total,
    };
  }
}
