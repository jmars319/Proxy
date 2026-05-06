import type {
  ShapeExternalOutputRequest,
  ShapeExternalOutputPresetRequest,
  ShapeExternalOutputResponse
} from "@proxy/api-contracts";
import { loadProfile } from "@proxy/profiles";
import {
  buildShapeExternalOutputRequestFromPreset,
  shapeExternalOutput
} from "@proxy/rewrite-engine/suite-shaping";
import {
  parseShapeExternalOutputPresetRequest,
  parseShapeExternalOutputRequest
} from "@proxy/validation";

export interface ShapeExternalOutputApiResponse {
  ok: boolean;
  request?: ShapeExternalOutputRequest;
  result?: ShapeExternalOutputResponse;
  errors?: string[];
}

function formatParseErrors(input: { error: { issues: Array<{ path: PropertyKey[]; message: string }> } }) {
  return input.error.issues.map((issue) =>
    `${issue.path.length ? issue.path.map(String).join(".") : "payload"}: ${issue.message}`
  );
}

export function handleShapeExternalOutputPayload(input: unknown): ShapeExternalOutputApiResponse {
  const preset = parseShapeExternalOutputPresetRequest(input);
  const full = parseShapeExternalOutputRequest(input);

  if (!preset.success && !full.success) {
    return {
      ok: false,
      errors: [...formatParseErrors(preset), ...formatParseErrors(full)]
    };
  }

  const defaultProfile = loadProfile("profile:default");
  const request = preset.success
    ? buildShapeExternalOutputRequestFromPreset(
        preset.data as ShapeExternalOutputPresetRequest,
        defaultProfile.metadata.id
      )
    : (full.data as ShapeExternalOutputRequest);
  const profile = loadProfile(request.profileId);

  return {
    ok: true,
    request,
    result: shapeExternalOutput(request, profile)
  };
}
