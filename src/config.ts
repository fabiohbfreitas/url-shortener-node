import { z } from "zod/v4";

type RoutePath = `/${string}`;

const pathSchema = z.string().regex(/^\/.+/, "must start with '/'");

export type AppConfig = {
  nodeEnv: string;
  serviceName: string;
  host: string;
  port: number;
  docsPath: RoutePath;
  swaggerPath: RoutePath;
  openApiPath: RoutePath;
};

const envSchema = z.object({
  NODE_ENV: z.string().min(1),
  SERVICE_NAME: z.string().min(1),
  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  DOCS_PATH: pathSchema,
  SWAGGER_PATH: pathSchema,
  OPENAPI_PATH: pathSchema,
});

const env = envSchema.parse(process.env);

export const config: AppConfig = {
  nodeEnv: env.NODE_ENV,
  serviceName: env.SERVICE_NAME,
  host: env.HOST,
  port: env.PORT,
  docsPath: env.DOCS_PATH as RoutePath,
  swaggerPath: env.SWAGGER_PATH as RoutePath,
  openApiPath: env.OPENAPI_PATH as RoutePath,
};
