import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import scalarApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import { parseError } from "evlog";
import { evlog } from "evlog/fastify";
import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransformers,
  serializerCompiler,
  validatorCompiler,
} from "fastify-zod-openapi";
import type { AppConfig } from "./config.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerShortLinksRoutes } from "./routes/short-links.js";
import { registerAuthRoutes } from "./routes/auth.js";
import type { AuthNotifier } from "./infrastructure/auth-notifier.js";
import { AuthService } from "./services/auth-service.js";
import { ShortLinkService } from "./services/short-link-service.js";
import type { IUserRepository } from "./infrastructure/user-repository.js";
import type { IShortLinkRepository } from "./infrastructure/short-link-repository.js";
import type { SessionRepository } from "./infrastructure/session-repository.js";
export const buildApp = async (
  config: AppConfig,
  userRepo: IUserRepository,
  shortLinkRepo: IShortLinkRepository,
  authNotifier: AuthNotifier,
  sessionRepo: SessionRepository,
) => {
  const app = Fastify({ logger: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(evlog);

  await app.register(fastifyCookie);

  await app.register(fastifyCors, {
    origin: [config.frontendUrl],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type"],
  });

  await app.register(fastifyZodOpenApiPlugin);
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "URL Shortener API",
        version: "1.0.0",
        description: "Node.js 24 + Fastify + Zod API foundation with Scalar documentation.",
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "sessionId",
            description: "Session cookie for authentication",
          },
        },
      },
    },
    ...fastifyZodOpenApiTransformers,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/swagger",
  });

  await app.register(scalarApiReference, {
    routePrefix: "/docs",
    configuration: {
      persistAuth: true,
      authentication: {
        preferredSecurityScheme: "cookieAuth",
      },
    },
  });

  app.get("/openapi.json", { schema: { hide: true } }, async () => app.swagger());

  app.decorate("sessionRepository", sessionRepo);
  app.decorate("userRepository", userRepo);

  const authService = new AuthService(userRepo, authNotifier, sessionRepo, config.sessionExpiresIn);
  const shortLinkService = new ShortLinkService(shortLinkRepo);

  await registerAuthRoutes(app, authService, {
    cookieSecure: config.cookieSecure,
    sameSite: config.sameSite,
    sessionExpiresIn: config.sessionExpiresIn,
  });
  await registerHealthRoute(app, config.serviceName);
  await registerShortLinksRoutes(app, shortLinkService);

  app.setErrorHandler((error: any, _request, reply) => {
    const status = error.statusCode || error.status || 500;
    const parsed = parseError(error);
    return reply.status(status).send({
      message: parsed.message || error.message,
      why: parsed.why,
      fix: parsed.fix,
      link: parsed.link,
    });
  });

  return app;
};
