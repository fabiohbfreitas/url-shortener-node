import type { FastifyInstance } from "fastify";
import { initLogger } from "evlog";
import { buildApp } from "../../app.js";
import type { AppConfig } from "../../config.js";
import type { DatabaseSync } from "../../db.js";

const defaultTestConfig: AppConfig = {
  nodeEnv: "test",
  serviceName: "url-shortener-api-test",
  host: "127.0.0.1",
  port: 3001,
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
  const db = database ?? (await import("../../db.js")).getTestDatabase();

  const app = await buildApp(config, db);
  return app;
};
