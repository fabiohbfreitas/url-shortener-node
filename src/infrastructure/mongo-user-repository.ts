import { ObjectId } from "mongodb";
import { UserDocument, AuthCodeDocument } from "./db.js";
import type { IUserRepository } from "./user-repository.js";

export class MongoUserRepository implements IUserRepository {
  constructor(
    private User: any,
    private AuthCode: any,
  ) {}

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.User.findOne({ email });
  }

  async createUser(email: string): Promise<UserDocument> {
    const user = await this.User.insertOne({ email });
    return user as UserDocument;
  }

  async findAuthCode(
    email: string,
    code: string,
  ): Promise<(AuthCodeDocument & { email: string }) | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const authCode = await this.AuthCode.findOne({
      userId: user._id.toString(),
      code,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date().toISOString() },
    });

    if (!authCode) return null;
    return { ...authCode, email: user.email } as AuthCodeDocument & { email: string };
  }

  async invalidateUserAuthCodes(userId: string): Promise<void> {
    await this.AuthCode.updateMany(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date().toISOString() } },
    );
  }

  async createAuthCode(userId: string, code: string, expiresAt: string): Promise<void> {
    await this.AuthCode.insertOne({
      userId,
      code,
      expiresAt,
    });
  }

  async markAuthCodeUsed(codeId: string): Promise<void> {
    await this.AuthCode.updateOne(
      { _id: new ObjectId(codeId) },
      { $set: { usedAt: new Date().toISOString() } },
    );
  }

  async findById(id: string): Promise<UserDocument | null> {
    return await this.User.findOne({ _id: new ObjectId(id) });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.User.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLoginAt: new Date().toISOString() } },
    );
  }
}
