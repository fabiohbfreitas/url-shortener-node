import type { FastifyInstance } from "fastify";
import { initLogger } from "evlog";
import { buildApp } from "../../app";
import type { AppConfig } from "../../config";
import { TestAuthNotifier } from "../../infrastructure/auth-notifier";
import { MemoryUserRepository } from "./repos/memory-user-repository";
import { MemoryShortLinkRepository } from "./repos/memory-short-link-repository";
import { MemorySessionRepository } from "../repos/memory-session-repository";

export type TestApp = FastifyInstance & { testAuthNotifier: TestAuthNotifier; cleanup: () => void };

const testConfig: AppConfig = {
  nodeEnv: "test",
  serviceName: "url-shortener-api-test",
  host: "127.0.0.1",
  port: 3001,
  authCodeExpiresIn: "10m",
  mongodbUri: "mongodb://localhost:27017/test",
  sessionCookieDomain: undefined,
  sessionExpiresIn: 7 * 24 * 60 * 60,
  cookieSecure: false,
  sameSite: "strict",
};

initLogger({
  silent: true,
  drain: () => {},
});

export const buildTestApp = async (): Promise<TestApp> => {
  const userRepo = new MemoryUserRepository();
  const shortLinkRepo = new MemoryShortLinkRepository();
  const sessionRepo = new MemorySessionRepository();
  const testAuthNotifier = new TestAuthNotifier();

  const app = await buildApp(testConfig, userRepo, shortLinkRepo, testAuthNotifier, sessionRepo);

  const extendedApp = app as TestApp;
  extendedApp.testAuthNotifier = testAuthNotifier;
  extendedApp.cleanup = () => {
    userRepo.cleanup();
    shortLinkRepo.cleanup();
    sessionRepo.cleanup();
    testAuthNotifier.clear();
  };

  return extendedApp;
};
