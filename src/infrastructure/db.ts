import Papr from 'papr';
import { schema, types } from 'papr';
import { MongoClient } from 'mongodb';

const UserSchema = schema({
  email: types.string({ required: true }),
  lastLoginAt: types.string(),
}, { timestamps: true });

const AuthCodeSchema = schema({
  userId: types.string({ required: true }),
  code: types.string({ required: true }),
  expiresAt: types.string({ required: true }),
  usedAt: types.string(),
}, { timestamps: true });

const ShortLinkSchema = schema({
  slug: types.string({ required: true }),
  originalUrl: types.string({ required: true }),
  userId: types.string({ required: true }),
  visits: types.number({ required: true }),
}, { timestamps: true });

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

export const createDatabase = async (uri: string, dbName: string) => {
  const papr = new Papr();

  const User = papr.model('users', UserSchema);
  const AuthCode = papr.model('auth_codes', AuthCodeSchema);
  const ShortLink = papr.model('short_links', ShortLinkSchema);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  papr.initialize(db);

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('auth_codes').createIndex({ userId: 1 });
  await db.collection('short_links').createIndex({ slug: 1 }, { unique: true });
  await db.collection('short_links').createIndex({ userId: 1 });

  return { papr, User, AuthCode, ShortLink, client };
};
