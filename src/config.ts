import { z } from "zod/v4";

export type AppConfig = {
  nodeEnv: string;
  serviceName: string;
  host: string;
  port: number;
};

const envSchema = z.object({
  NODE_ENV: z.string().min(1),
  SERVICE_NAME: z.string().min(1),
  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
});

const env = envSchema.parse(process.env);

export const config: AppConfig = {
  nodeEnv: env.NODE_ENV,
  serviceName: env.SERVICE_NAME,
  host: env.HOST,
  port: env.PORT,
};
