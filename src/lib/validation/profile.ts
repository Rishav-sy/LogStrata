import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().max(80),
  avatarUrl: z.union([z.literal(""), z.string().trim().url().max(500)]),
});
