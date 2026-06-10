import { z } from "zod";

export const scenarioConfigurationSchema = z.object({
  version: z.literal(1),
  trafficMode: z.enum(["normal", "high", "viral", "ddos"]),
  requestRate: z.number().int().min(0).max(1_000_000),
  failures: z.object({
    database: z.boolean(),
    api: z.boolean(),
    auth: z.boolean(),
    timeout: z.boolean(),
    serviceCrash: z.boolean(),
  }),
  resources: z.object({
    cpu: z.number().min(0).max(100),
    memory: z.number().min(0).max(100),
    disk: z.number().min(0).max(100),
    network: z.number().min(0).max(100),
  }),
  autoScalingEnabled: z.boolean(),
  activeAnomaly: z.enum(["none", "leak", "spike", "storm", "outage"]),
});

export type ScenarioConfiguration = z.infer<typeof scenarioConfigurationSchema>;

export const savedScenarioSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  configuration: scenarioConfigurationSchema,
});
