import type {
  ProxySuiteShapingPresetId,
  ShapeExternalOutputRequest,
  ShapeExternalOutputPresetRequest,
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

export const suiteShapingPresets: Record<
  ProxySuiteShapingPresetId,
  Pick<ShapeExternalOutputRequest, "clientApp" | "surface" | "purpose" | "audience" | "hardConstraints">
> = {
  "scout-outreach": {
    clientApp: "scout",
    surface: "email",
    purpose: "Turn an opportunity handoff into restrained outreach grounded only in provided evidence.",
    audience: "prospect or local partner",
    hardConstraints: ["Do not invent claims", "Reference only supplied evidence", "Keep the ask specific"]
  },
  "guardrail-review": {
    clientApp: "guardrail",
    surface: "moderation-note",
    purpose: "Explain a policy decision with a calm review posture.",
    audience: "operator reviewing an external action",
    hardConstraints: ["Do not imply approval unless the decision allows it", "Name the review reason plainly"]
  },
  "partition-operator-brief": {
    clientApp: "partition",
    surface: "operator-brief",
    purpose: "Explain a read-only validation request without implying execution is available.",
    audience: "local operator",
    hardConstraints: ["Use read-only language", "Keep destructive action locked"]
  },
  "assembly-document-note": {
    clientApp: "assembly",
    surface: "internal-note",
    purpose: "Shape a content workflow note before it becomes customer-facing copy.",
    audience: "content operator",
    hardConstraints: ["Keep source attribution visible", "Do not publish directly"]
  }
};

export function buildShapeExternalOutputRequestFromPreset(
  request: ShapeExternalOutputPresetRequest,
  fallbackProfileId: ShapeExternalOutputRequest["profileId"]
): ShapeExternalOutputRequest {
  const preset = suiteShapingPresets[request.presetId];

  return {
    ...preset,
    profileId: request.profileId ?? fallbackProfileId,
    draftText: request.draftText,
    audience: request.audience ?? preset.audience,
    sourceArtifact: request.sourceArtifact,
    hardConstraints: [...preset.hardConstraints, ...(request.hardConstraints ?? [])],
    traceId: request.traceId
  };
}

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
