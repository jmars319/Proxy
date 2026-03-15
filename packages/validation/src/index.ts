import { z } from "zod";
import type { ValidationReport, VoiceProfile } from "@proxy/domain";

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
  valid: z.boolean(),
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

export const rewrittenOutputSchema = z.string().trim().min(1).max(600);

export const parseGenerateDraftRequest = (input: unknown) =>
  generateDraftRequestSchema.safeParse(input);

export const validateRewrittenOutput = (
  output: string,
  profile: Pick<VoiceProfile, "bannedPhrases">
): ValidationReport => {
  const rewritten = output.trim();
  const warnings: string[] = [];
  const violations: string[] = [];

  const schemaResult = rewrittenOutputSchema.safeParse(rewritten);
  if (!schemaResult.success) {
    violations.push("Rewrite produced an empty or excessively long result.");
  }

  const matchedBannedPhrases = profile.bannedPhrases.filter((phrase) =>
    rewritten.toLowerCase().includes(phrase.toLowerCase())
  );

  if (matchedBannedPhrases.length > 0) {
    violations.push(`Banned phrases still present: ${matchedBannedPhrases.join(", ")}.`);
  }

  if (rewritten.length > 320) {
    warnings.push("Output is longer than the current compact-output target.");
  }

  if (rewritten.length > 0 && rewritten.length < 24) {
    warnings.push("Output is very short; the rewrite may be overly aggressive.");
  }

  const valid = violations.length === 0;

  return {
    valid,
    isValid: valid,
    violations,
    warnings,
    boundary: "local-only"
  };
};
