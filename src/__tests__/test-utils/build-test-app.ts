import type { FastifyInstance } from "fastify";
import { initLogger } from "evlog";
import { buildApp } from "../../app.js";
import type { AppConfig } from "../../config.js";
import { TestAuthNotifier } from "../../infrastructure/auth-notifier.js";
import { MemoryUserRepository } from "./repos/memory-user-repository.js";
import { MemoryShortLinkRepository } from "./repos/memory-short-link-repository.js";

export type TestApp = FastifyInstance & { testAuthNotifier: TestAuthNotifier; cleanup: () => void };

const defaultTestConfig: AppConfig = {
  nodeEnv: "test",
  serviceName: "url-shortener-api-test",
  host: "127.0.0.1",
  port: 3001,
  jwtSecret: "test-jwt-secret-that-is-at-least-32-characters-long",
  jwtAccessExpiresIn: "15m",
  authCodeExpiresIn: "10m",
  mongodbUri: "",
};

initLogger({
  silent: true,
  drain: () => {},
});

export const buildTestApp = async (
  configOverrides: Partial<AppConfig> = {},
): Promise<TestApp> => {
  const config = { ...defaultTestConfig, ...configOverrides };

  const userRepo = new MemoryUserRepository();
  const shortLinkRepo = new MemoryShortLinkRepository();
  const testAuthNotifier = new TestAuthNotifier();

  const app = await buildApp(config, userRepo, shortLinkRepo, testAuthNotifier);

  const extendedApp = app as TestApp;
  extendedApp.testAuthNotifier = testAuthNotifier;
  extendedApp.cleanup = () => {
    userRepo.cleanup();
    shortLinkRepo.cleanup();
    testAuthNotifier.clear();
  };

  return extendedApp;
};
