import type {
  ShapeExternalOutputRequest,
  ShapeExternalOutputPresetRequest,
  ShapeExternalOutputResponse
} from "@proxy/api-contracts";
import { readSuiteProfilePresetOverrides } from "@proxy/config";
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

function applySavedProfilePreset(
  request: ShapeExternalOutputRequest,
  presetKey?: string
): ShapeExternalOutputRequest {
  const overrides = readSuiteProfilePresetOverrides(process.env);
  const override = (presetKey ? overrides[presetKey] : undefined) ?? overrides[request.clientApp];

  if (!override) {
    return request;
  }

  return {
    ...request,
    profileId: (override.profileId ?? request.profileId) as ShapeExternalOutputRequest["profileId"],
    hardConstraints: [...request.hardConstraints, ...(override.hardConstraints ?? [])]
  };
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
  const request = applySavedProfilePreset(preset.success
    ? buildShapeExternalOutputRequestFromPreset(
        preset.data as ShapeExternalOutputPresetRequest,
        defaultProfile.metadata.id
      )
    : (full.data as ShapeExternalOutputRequest),
    preset.success ? preset.data.presetId : undefined);
  const profile = loadProfile(request.profileId);

  return {
    ok: true,
    request,
    result: shapeExternalOutput(request, profile)
  };
}
