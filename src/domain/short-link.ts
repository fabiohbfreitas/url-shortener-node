import { z } from "zod/v4";

export const ShortLinkSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  original_url: z.string().url(),
  user_id: z.number().int().positive(),
  created_at: z.string(),
  visits: z.number().int().min(0),
});

export type ShortLink = z.infer<typeof ShortLinkSchema>;
