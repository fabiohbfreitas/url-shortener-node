import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";
import type { AppConfig } from "../../config.js";

const defaultTestConfig: AppConfig = {
  nodeEnv: "test",
  serviceName: "url-shortener-api-test",
  host: "127.0.0.1",
  port: 3001,
  docsPath: "/docs",
  swaggerPath: "/swagger",
  openApiPath: "/openapi.json",
};

export const buildTestApp = async (
  configOverrides: Partial<AppConfig> = {},
): Promise<FastifyInstance> => buildApp({ ...defaultTestConfig, ...configOverrides });
