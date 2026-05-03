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
import { registerAuthPlugin } from "./plugins/auth.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerShortLinksRoutes } from "./routes/short-links.js";
import { registerAuthRoutes } from "./routes/auth.js";
import type { AuthNotifier } from "./infrastructure/auth-notifier.js";
import { AuthService } from "./services/auth-service.js";
import { ShortLinkService } from "./services/short-link-service.js";
import type { IUserRepository } from "./infrastructure/user-repository.js";
import type { IShortLinkRepository } from "./infrastructure/short-link-repository.js";

export const buildApp = async (
  config: AppConfig,
  userRepo: IUserRepository,
  shortLinkRepo: IShortLinkRepository,
  authNotifier: AuthNotifier,
) => {
  const app = Fastify({ logger: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(evlog);

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
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
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
        preferredSecurityScheme: "bearerAuth",
      },
    },
  });

  app.get("/openapi.json", { schema: { hide: true } }, async () => app.swagger());

  await app.register(registerAuthPlugin, config);

  const authService = new AuthService(userRepo, authNotifier, app);
  const shortLinkService = new ShortLinkService(shortLinkRepo);

  await registerAuthRoutes(app, authService);
  await registerHealthRoute(app, config.serviceName);
  await registerShortLinksRoutes(app, shortLinkService);

  app.setErrorHandler((error, _request, reply) => {
    const parsed = parseError(error);
    const status = parsed.status ?? 500;
    return reply.status(status).send({
      message: parsed.message,
      why: parsed.why,
      fix: parsed.fix,
      link: parsed.link,
    });
  });

  return app;
};
