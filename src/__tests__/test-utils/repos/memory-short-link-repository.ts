import type { ShortLinkDocument } from "./db.js";
import type { IShortLinkRepository } from "./short-link-repository.js";

export class MemoryShortLinkRepository implements IShortLinkRepository {
  private shortLinks: ShortLinkDocument[] = [];
  private idCounter = 1;

  async createShortLink(
    slug: string,
    originalUrl: string,
    userId: string,
  ): Promise<ShortLinkDocument> {
    const now = new Date();
    const shortLink: ShortLinkDocument = {
      _id: String(this.idCounter++),
      slug,
      originalUrl,
      userId,
      visits: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.shortLinks.push(shortLink);
    return shortLink;
  }

  async findShortLinkBySlug(slug: string): Promise<ShortLinkDocument | null> {
    return this.shortLinks.find((sl) => sl.slug === slug) || null;
  }

  async findShortLinkBySlugAndUserId(
    slug: string,
    userId: string,
  ): Promise<ShortLinkDocument | null> {
    return this.shortLinks.find((sl) => sl.slug === slug && sl.userId === userId) || null;
  }

  async incrementVisits(slug: string): Promise<void> {
    const shortLink = this.shortLinks.find((sl) => sl.slug === slug);
    if (shortLink) {
      shortLink.visits++;
    }
  }

  async deleteShortLinkBySlugAndUserId(slug: string, userId: string): Promise<boolean> {
    const index = this.shortLinks.findIndex((sl) => sl.slug === slug && sl.userId === userId);
    if (index === -1) return false;
    this.shortLinks.splice(index, 1);
    return true;
  }

  async listShortLinksByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ShortLinkDocument[]; total: number }> {
    const userLinks = this.shortLinks
      .filter((sl) => sl.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = userLinks.length;
    const offset = (page - 1) * limit;
    const items = userLinks.slice(offset, offset + limit);

    return { items, total };
  }

  cleanup() {
    this.shortLinks = [];
    this.idCounter = 1;
  }
}
