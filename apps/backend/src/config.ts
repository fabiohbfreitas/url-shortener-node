import { z } from "zod/v4";

export type AppConfig = {
  nodeEnv: string;
  serviceName: string;
  host: string;
  port: number;
  authCodeExpiresIn: string;
  mongodbUri: string;
  sessionCookieDomain: string | undefined;
  sessionExpiresIn: number;
  cookieSecure: boolean;
  sameSite: "strict" | "lax";
  frontendUrl: string;
};

const envSchema = z.object({
  NODE_ENV: z.string().min(1),
  SERVICE_NAME: z.string().min(1),
  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  AUTH_CODE_EXPIRES_IN: z.string().default("10m"),
  MONGODB_URI: z.string().min(1),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  SESSION_EXPIRES_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60),
  FRONTEND_URL: z.string().min(1),
});

export function getConfig(): AppConfig {
  const env = envSchema.parse(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    serviceName: env.SERVICE_NAME,
    host: env.HOST,
    port: env.PORT,
    authCodeExpiresIn: env.AUTH_CODE_EXPIRES_IN,
    mongodbUri: env.MONGODB_URI,
    sessionCookieDomain: env.SESSION_COOKIE_DOMAIN,
    sessionExpiresIn: env.SESSION_EXPIRES_IN,
    cookieSecure: env.NODE_ENV === "production",
    sameSite: env.SESSION_COOKIE_DOMAIN ? "lax" : "strict",
    frontendUrl: env.FRONTEND_URL,
  };
}
