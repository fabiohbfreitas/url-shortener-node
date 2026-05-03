import { z } from "zod/v4";

export const ShortLinkSchema = z.object({
  _id: z.any(),
  slug: z.string().min(1),
  originalUrl: z.string().url(),
  userId: z.any(),
  visits: z.number().int().min(0),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type ShortLink = z.infer<typeof ShortLinkSchema>;
