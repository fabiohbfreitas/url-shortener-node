import "fastify";
import { SessionRepository } from "../infrastructure/session-repository";
import { UserRepository } from "../infrastructure/user-repository";

declare module "fastify" {
  export interface FastifyRequest {
    user: {
      userId: string;
      email: string;
    };
  }

  export interface FastifyInstance {
    sessionRepository: SessionRepository;
    userRepository: UserRepository;
  }
}
