import type { FastifyInstance } from "fastify";
import { initLogger } from "evlog";
import { buildApp } from "../../app.js";
import type { AppConfig } from "../../config.js";
import type { DatabaseSync } from "../../infrastructure/database.js";
import { NoopAuthNotifier } from "../../infrastructure/auth-notifier.js";

const defaultTestConfig: AppConfig = {
  nodeEnv: "test",
  serviceName: "url-shortener-api-test",
  host: "127.0.0.1",
  port: 3001,
  jwtSecret: "test-jwt-secret-that-is-at-least-32-characters-long",
  jwtAccessExpiresIn: "15m",
  authCodeExpiresIn: "10m",
};

initLogger({
  silent: true,
  drain: () => {},
});

export const buildTestApp = async (
  configOverrides: Partial<AppConfig> = {},
  database?: DatabaseSync,
): Promise<FastifyInstance> => {
  const config = { ...defaultTestConfig, ...configOverrides };
  const db = database ?? (await import("../../infrastructure/database.js")).getTestDatabase();

  const authNotifier = new NoopAuthNotifier();

  const app = await buildApp(config, db, authNotifier);
  return app;
};
