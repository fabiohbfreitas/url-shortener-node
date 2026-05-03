import { getConfig } from "./config.js";
import { buildApp } from "./app.js";
import { MongoUserRepository } from "./infrastructure/mongo-user-repository.js";
import { MongoShortLinkRepository } from "./infrastructure/mongo-short-link-repository.js";
import { MongoSessionRepository } from "./infrastructure/mongo-session-repository.js";
import { ConsoleAuthNotifier } from "./infrastructure/auth-notifier.js";
import { createDatabase } from "./infrastructure/db.js";

const start = async () => {
  const appConfig = getConfig();

  const { userCollection, authCodeCollection, shortLinkCollection, sessionCollection, client } =
    await createDatabase(appConfig.mongodbUri, "url-shortener");

  const userRepo = new MongoUserRepository(userCollection, authCodeCollection);
  const shortLinkRepo = new MongoShortLinkRepository(shortLinkCollection);
  const sessionRepo = new MongoSessionRepository(sessionCollection);
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
    await client.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start();
