import type {
  ShapeExternalOutputRequest,
  ShapeExternalOutputResponse
} from "@proxy/api-contracts";
import type { VoiceProfile } from "@proxy/domain";
import { validateRewrittenOutput } from "@proxy/validation";
import { rewriteDraft } from "./index";

const surfaceIntros: Record<ShapeExternalOutputRequest["surface"], string> = {
  email: "Shape this as a concise email.",
  letter: "Shape this as a clear letter.",
  "moderation-note": "Shape this as a Guardrail moderation note with a calm decision posture.",
  "operator-brief": "Shape this as a Partition operator brief that avoids execution language.",
  "public-listing": "Shape this as public listing copy.",
  proposal: "Shape this as a proposal section.",
  report: "Shape this as a report note.",
  "support-note": "Shape this as a support note.",
  "website-copy": "Shape this as website copy.",
  "internal-note": "Shape this as an internal note."
};

export function shapeExternalOutput(
  request: ShapeExternalOutputRequest,
  profile: VoiceProfile
): ShapeExternalOutputResponse {
  const sourceLine = request.sourceArtifact
    ? `Source artifact: ${request.sourceArtifact.schema}${request.sourceArtifact.artifactId ? ` / ${request.sourceArtifact.artifactId}` : ""}.`
    : "Source artifact: direct draft.";
  const shapedDraft = [
    surfaceIntros[request.surface],
    `Client app: ${request.clientApp}.`,
    `Purpose: ${request.purpose}.`,
    request.audience ? `Audience: ${request.audience}.` : "",
    sourceLine,
    request.hardConstraints.length ? `Constraints: ${request.hardConstraints.join("; ")}.` : "",
    "",
    request.draftText
  ]
    .filter(Boolean)
    .join("\n");
  const rewriteReport = rewriteDraft(shapedDraft, profile);
  const validation = validateRewrittenOutput(rewriteReport.rewritten, profile);
  const guardrailRecommended =
    request.surface === "moderation-note" ||
    request.clientApp === "guardrail" ||
    !validation.valid ||
    validation.warnings.length > 0;

  return {
    text: validation.valid ? rewriteReport.rewritten : "Validation blocked the shaped output.",
    validation,
    rewriteReport,
    escalation: {
      decision: "stay-local",
      reason: "Suite shaping uses the local voice profile and deterministic rewrite pipeline.",
      targetProviderId: profile.defaultProviderId
    },
    guardrailRecommended
  };
}
