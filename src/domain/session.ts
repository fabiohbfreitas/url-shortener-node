import { z } from "zod/v4";

export const SessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  expiresAt: z.date(),
  createdAt: z.date(),
  lastUsedAt: z.date(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type Session = z.infer<typeof SessionSchema>;
