import type { FastifyInstance } from "fastify";
import type { DatabaseSync } from "../infrastructure/database.js";
import type { AuthNotifier } from "../infrastructure/auth-notifier.js";
import { customAlphabet } from "nanoid";
import {
  findOrCreateUser,
  createAuthCode,
  findValidAuthCode,
  markAuthCodeUsed,
  updateUserLastLogin,
  invalidateUserAuthCodes,
} from "../infrastructure/database.js";

const numericAlphabet = "0123456789";
const generateCode = customAlphabet(numericAlphabet, 6);

export class AuthService {
  constructor(
    private db: DatabaseSync,
    private notifier: AuthNotifier,
    private app: FastifyInstance,
  ) {}

  login(email: string): { message: string } {
    const user = findOrCreateUser(this.db, email);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    invalidateUserAuthCodes(this.db, user.id);
    createAuthCode(this.db, user.id, code, expiresAt);

    this.notifier.notify(email, code);

    return { message: "Verification code sent" };
  }

  verify(email: string, code: string): { accessToken: string } {
    const authCode = findValidAuthCode(this.db, email, code);

    if (!authCode) {
      throw new Error("Invalid or expired code");
    }

    markAuthCodeUsed(this.db, authCode.id);
    updateUserLastLogin(this.db, authCode.user_id);

    const token = this.app.jwt.sign({
      userId: authCode.user_id,
      email: authCode.email,
    });

    return { accessToken: token };
  }
}
