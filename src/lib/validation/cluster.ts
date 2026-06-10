import { z } from "zod";

export const clusterProviders = ["kubernetes", "eks", "gke", "aks", "local"] as const;
export const clusterEnvironments = ["development", "staging", "production"] as const;
export const clusterStatuses = [
  "draft",
  "onboarding",
  "ready",
  "degraded",
  "offline",
  "archived",
] as const;

export const connectionMetadataSchema = z.record(
  z.string().trim().min(1).max(60),
  z.string().trim().max(300),
);

export const clusterSchema = z.object({
  name: z.string().trim().min(1).max(100),
  provider: z.enum(clusterProviders),
  environment: z.enum(clusterEnvironments),
  status: z.enum(clusterStatuses),
  onboardingStep: z.coerce.number().int().min(1).max(4),
  connectionMetadata: connectionMetadataSchema,
});
