import { z } from "zod/v4";

export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string(),
  last_login_at: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthCodeSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  code: z.string().min(1),
  expires_at: z.string(),
  used_at: z.string().nullable(),
  created_at: z.string(),
});

export type AuthCode = z.infer<typeof AuthCodeSchema>;
