import type { FastifyInstance } from "fastify";
import type { AuthNotifier } from "../infrastructure/auth-notifier.js";
import type { IUserRepository } from "../infrastructure/user-repository.js";
import { customAlphabet } from "nanoid";

const numericAlphabet = "0123456789";
const generateCode = customAlphabet(numericAlphabet, 6);

export class AuthService {
  constructor(
    private userRepo: IUserRepository,
    private authNotifier: AuthNotifier,
    private app: FastifyInstance,
  ) {}

  async login(email: string): Promise<{ message: string }> {
    let user = await this.userRepo.findUserByEmail(email);

    if (!user) {
      user = await this.userRepo.createUser(email);
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await this.userRepo.invalidateUserAuthCodes(user._id);

    await this.userRepo.createAuthCode(user._id, code, expiresAt);

    this.authNotifier.notify(email, code);

    return { message: "Verification code sent" };
  }

  async verify(email: string, code: string): Promise<{ accessToken: string }> {
    const authCode = await this.userRepo.findAuthCode(email, code);

    if (!authCode) {
      throw new Error("Invalid or expired code");
    }

    await this.userRepo.markAuthCodeUsed(authCode._id);

    await this.userRepo.updateLastLogin(authCode.userId);

    const token = this.app.jwt.sign({
      userId: authCode.userId,
      email,
    });

    return { accessToken: token };
  }
}
