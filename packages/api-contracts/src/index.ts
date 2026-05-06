import type {
  EscalationDecision,
  GenerationRequest,
  GenerationResponse,
  ProviderRoutingResult,
  RewriteReport,
  ValidationReport,
  VoiceProfileSummary
} from "@proxy/domain";
import type { ProfileId } from "@proxy/shared-types";

export type ProxyClientApp =
  | "align"
  | "assembly"
  | "derive"
  | "facet"
  | "guardrail"
  | "ledger"
  | "partition"
  | "registry"
  | "scout"
  | "sentinel"
  | "vicina"
  | "unknown";

export type ProxyOutputSurface =
  | "email"
  | "letter"
  | "moderation-note"
  | "operator-brief"
  | "public-listing"
  | "proposal"
  | "report"
  | "support-note"
  | "website-copy"
  | "internal-note";

export interface ShapeExternalOutputRequest {
  clientApp: ProxyClientApp;
  surface: ProxyOutputSurface;
  profileId: ProfileId;
  purpose: string;
  draftText: string;
  audience?: string;
  sourceArtifact?: {
    schema: string;
    artifactId?: string;
    exportedAt?: string;
  };
  hardConstraints: string[];
  traceId: string;
}

export interface ShapeExternalOutputResponse {
  text: string;
  validation: ValidationReport;
  rewriteReport: RewriteReport;
  escalation: EscalationDecision;
  guardrailRecommended: boolean;
}

export interface GenerateDraftRequest {
  generation: GenerationRequest;
  previewOnly?: boolean;
}

export interface GenerateDraftResponse {
  response: GenerationResponse;
  routing: ProviderRoutingResult;
  rewriteReport: RewriteReport;
  validation: ValidationReport;
  escalation: EscalationDecision;
}

export interface ValidateOutputRequest {
  profileId: ProfileId;
  text: string;
}

export interface ValidateOutputResponse {
  report: ValidationReport;
}

export interface ListProfilesResponse {
  profiles: VoiceProfileSummary[];
}
