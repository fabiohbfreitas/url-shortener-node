import { MongoClient, Collection } from "mongodb";

export type UserDocument = {
  _id: string;
  email: string;
  lastLoginAt?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthCodeDocument = {
  _id: string;
  userId: string;
  code: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ShortLinkDocument = {
  _id: string;
  slug: string;
  originalUrl: string;
  userId: string;
  visits: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionDocument = {
  _id: string;
  sessionId: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
};

export const createDatabase = async (uri: string, dbName: string) => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("auth_codes").createIndex({ userId: 1 });
  await db.collection("short_links").createIndex({ slug: 1 }, { unique: true });
  await db.collection("short_links").createIndex({ userId: 1 });
  await db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true });
  await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  return {
    userCollection: db.collection("users"),
    authCodeCollection: db.collection("auth_codes"),
    shortLinkCollection: db.collection("short_links"),
    sessionCollection: db.collection("sessions"),
    client,
  };
};

export type DatabaseCollections = {
  userCollection: Collection;
  authCodeCollection: Collection;
  shortLinkCollection: Collection;
  sessionCollection: Collection;
  client: MongoClient;
};
