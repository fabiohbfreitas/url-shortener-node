import { z } from "zod/v4";

export const UserSchema = z.object({
  _id: z.any(),
  email: z.string().email(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthCodeSchema = z.object({
  _id: z.any(),
  userId: z.any(),
  code: z.string().min(1),
  expiresAt: z.string(),
  usedAt: z.string().nullable(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type AuthCode = z.infer<typeof AuthCodeSchema>;
