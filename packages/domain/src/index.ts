import type { AuditStamp, ProfileId, ProviderId, TimestampMs } from "@proxy/shared-types";

export interface ProfileMetadata extends AuditStamp {
  id: ProfileId;
  name: string;
  description: string;
  tags: string[];
}

export interface VoiceRule {
  kind: "style" | "constraint" | "safety";
  label: string;
  instruction: string;
}

export interface VoiceProfile {
  metadata: ProfileMetadata;
  tone: string;
  audience: string;
  bannedPhrases: string[];
  styleRules: string[];
  rewriteDirectives: string[];
  hardConstraints: string[];
  rules: VoiceRule[];
  defaultProviderId?: ProviderId;
}

export interface VoiceProfileSummary {
  id: ProfileId;
  name: string;
  description: string;
  tags: string[];
}

export interface GenerationRequest {
  prompt: string;
  profileId: ProfileId;
  providerHint?: ProviderId;
  allowCloudEscalation: boolean;
  traceId: string;
  requestedAt: TimestampMs;
}

export interface GenerationResponse {
  rawText: string;
  rewrittenText: string;
  providerId: ProviderId;
  latencyMs: number;
  escalated: boolean;
  completedAt: TimestampMs;
}

export interface ProviderRoutingResult {
  providerId: ProviderId;
  mode: "local" | "cloud";
  reason: string;
  fallbackProviderId?: ProviderId;
}

export interface RewriteStepReport {
  stepId: string;
  changed: boolean;
  note: string;
}

export interface RewriteReport {
  original: string;
  rewritten: string;
  changesApplied: string[];
  appliedSteps: RewriteStepReport[];
  summary: string;
  finalText: string;
}

export interface ValidationReport {
  valid: boolean;
  isValid: boolean;
  violations: string[];
  warnings: string[];
  boundary: "local-only" | "cloud-allowed";
}

export interface EscalationDecision {
  decision: "stay-local" | "escalate" | "deny";
  reason: string;
  targetProviderId?: ProviderId;
}
