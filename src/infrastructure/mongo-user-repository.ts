import { ObjectId } from "mongodb";
import { UserDocument, AuthCodeDocument } from "./db.js";
import type { IUserRepository } from "./user-repository.js";
import type { Collection } from "mongodb";

export class MongoUserRepository implements IUserRepository {
  constructor(
    private userCollection: Collection,
    private authCodeCollection: Collection,
  ) {}

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.userCollection.findOne({ email });
    if (!user) return null;
    return { ...user, _id: user._id.toString() } as UserDocument;
  }

  async createUser(email: string): Promise<UserDocument> {
    const now = new Date();
    const result = await this.userCollection.insertOne({
      email,
      createdAt: now,
      updatedAt: now,
    });
    return {
      _id: result.insertedId.toString(),
      email,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findAuthCode(
    email: string,
    code: string,
  ): Promise<(AuthCodeDocument & { email: string }) | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const authCode = await this.authCodeCollection.findOne({
      userId: user._id,
      code,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date().toISOString() },
    });

    if (!authCode) return null;
    return { ...authCode, _id: authCode._id.toString(), email: user.email } as AuthCodeDocument & {
      email: string;
    };
  }

  async invalidateUserAuthCodes(userId: string): Promise<void> {
    await this.authCodeCollection.updateMany(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date().toISOString() } },
    );
  }

  async createAuthCode(userId: string, code: string, expiresAt: string): Promise<void> {
    await this.authCodeCollection.insertOne({
      userId,
      code,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async markAuthCodeUsed(codeId: string): Promise<void> {
    await this.authCodeCollection.updateOne(
      { _id: new ObjectId(codeId) },
      { $set: { usedAt: new Date().toISOString(), updatedAt: new Date() } },
    );
  }

  async findById(id: string): Promise<UserDocument | null> {
    const user = await this.userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    return { ...user, _id: user._id.toString() } as UserDocument;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLoginAt: new Date().toISOString(), updatedAt: new Date() } },
    );
  }
}
