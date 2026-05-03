import { getConfig } from "./config.js";
import { buildApp } from "./app.js";
import { MongoUserRepository } from "./infrastructure/mongo-user-repository.js";
import { MongoShortLinkRepository } from "./infrastructure/mongo-short-link-repository.js";
import { MongoSessionRepository } from "./infrastructure/mongo-session-repository.js";
import { ConsoleAuthNotifier } from "./infrastructure/auth-notifier.js";
import { createDatabase } from "./infrastructure/db.js";

const start = async () => {
  const appConfig = getConfig();

  const { User, AuthCode, ShortLink, Session } = await createDatabase(
    appConfig.mongodbUri,
    "url-shortener",
  );

  const userRepo = new MongoUserRepository(User, AuthCode);
  const shortLinkRepo = new MongoShortLinkRepository(ShortLink);
  const sessionRepo = new MongoSessionRepository(Session);
  const authNotifier = new ConsoleAuthNotifier();

  const app = await buildApp(appConfig, userRepo, shortLinkRepo, authNotifier, sessionRepo);

  try {
    await app.listen({ port: appConfig.port, host: appConfig.host });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start();
