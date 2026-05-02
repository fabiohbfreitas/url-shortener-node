import { z } from "zod/v4";

export type AppConfig = {
  nodeEnv: string;
  serviceName: string;
  host: string;
  port: number;
  jwtSecret: string;
  jwtAccessExpiresIn: string;
  authCodeExpiresIn: string;
};

const envSchema = z.object({
  NODE_ENV: z.string().min(1),
  SERVICE_NAME: z.string().min(1),
  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  AUTH_CODE_EXPIRES_IN: z.string().default("10m"),
});

const env = envSchema.parse(process.env);

export const config: AppConfig = {
  nodeEnv: env.NODE_ENV,
  serviceName: env.SERVICE_NAME,
  host: env.HOST,
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
  jwtAccessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  authCodeExpiresIn: env.AUTH_CODE_EXPIRES_IN,
};
