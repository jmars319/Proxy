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
