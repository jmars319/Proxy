import defaultProfileArtifactData from "../../../profiles/default/profile.json";
import type { VoiceProfile } from "@proxy/domain";
import type { ProfileId } from "@proxy/shared-types";
import {
  parsePortableProfileArtifact,
  type PortableProfileArtifactInput
} from "@proxy/validation";

export const PROFILE_FILE_EXTENSION = ".proxy-profile.json";
export const DEFAULT_PROFILE_ARTIFACT_PATH = "profiles/default/profile.json";

export type PortableProfileArtifact = PortableProfileArtifactInput;

const profileArtifactTimestamp = Date.UTC(2026, 2, 15);

const profileArtifactRegistry: Record<string, unknown> = {
  default: defaultProfileArtifactData
};

const normalizeProfileLookupId = (profileId: string): string => profileId.replace(/^profile:/, "");

const toDomainProfileId = (profileId: string): ProfileId => `profile:${profileId}`;

const toRuleLabel = (rule: string): string =>
  rule
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const toVoiceProfile = (artifact: PortableProfileArtifact): VoiceProfile => ({
  metadata: {
    id: toDomainProfileId(artifact.id),
    name: artifact.name,
    description: artifact.description,
    tags: [artifact.id, "portable-profile", "local-first"],
    createdAt: profileArtifactTimestamp,
    updatedAt: profileArtifactTimestamp
  },
  tone: artifact.tone,
  audience: "general",
  bannedPhrases: [...artifact.bannedPhrases],
  styleRules: [...artifact.styleRules],
  rewriteDirectives: [...artifact.styleRules],
  hardConstraints: [
    "Do not let provider voice override the profile.",
    "Remove banned phrases before final output is shown."
  ],
  rules: artifact.styleRules.map((rule) => ({
    kind: "style" as const,
    label: toRuleLabel(rule),
    instruction: rule
  })),
  defaultProviderId: "provider:local-default"
});

/**
 * Profiles are intended to be portable artifacts that can be versioned,
 * exported, imported, and tested outside any single app surface.
 */
export const loadProfileArtifact = (profileId: string): PortableProfileArtifact => {
  const lookupId = normalizeProfileLookupId(profileId);
  const candidate = profileArtifactRegistry[lookupId];

  if (!candidate) {
    throw new Error(`No profile artifact is registered for "${profileId}".`);
  }

  const parsed = parsePortableProfileArtifact(candidate);
  if (!parsed.success) {
    throw new Error(`Profile artifact "${profileId}" is invalid.`);
  }

  return clone(parsed.data);
};

export const loadProfile = (profileId: string): VoiceProfile =>
  toVoiceProfile(loadProfileArtifact(profileId));

export const loadDefaultProfile = (): VoiceProfile => loadProfile("default");

export const isSupportedProfileFile = (fileName: string): boolean =>
  fileName.endsWith(PROFILE_FILE_EXTENSION);

export const formatProfileFilename = (profileName: string): string => {
  const slug = profileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "profile"}${PROFILE_FILE_EXTENSION}`;
};
