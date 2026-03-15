import { z } from "zod";

const profileIdSchema = z.string().regex(/^profile:/, "Profile IDs must start with profile:");
const providerIdSchema = z.string().regex(/^provider:/, "Provider IDs must start with provider:");
const timestampSchema = z.number().int().nonnegative();

export const profileMetadataSchema = z.object({
  id: profileIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

export const generateDraftRequestSchema = z.object({
  prompt: z.string().min(1),
  profileId: profileIdSchema,
  providerHint: providerIdSchema.optional(),
  allowCloudEscalation: z.boolean().default(false),
  traceId: z.string().min(1),
  requestedAt: timestampSchema
});

export const validationResultSchema = z.object({
  isValid: z.boolean(),
  violations: z.array(z.string()),
  warnings: z.array(z.string()),
  boundary: z.enum(["local-only", "cloud-allowed"])
});

export const providerConfigSchema = z.object({
  id: providerIdSchema,
  label: z.string().min(1),
  mode: z.enum(["local", "cloud"]),
  enabled: z.boolean().default(true),
  endpoint: z.url().optional(),
  apiKeyEnvVar: z.string().min(1).optional()
});

export type ProfileMetadataInput = z.infer<typeof profileMetadataSchema>;
export type GenerateDraftRequestInput = z.infer<typeof generateDraftRequestSchema>;
export type ValidationResultInput = z.infer<typeof validationResultSchema>;
export type ProviderConfigInput = z.infer<typeof providerConfigSchema>;

export const parseGenerateDraftRequest = (input: unknown) =>
  generateDraftRequestSchema.safeParse(input);
