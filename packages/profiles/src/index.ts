import type { VoiceProfile } from "@proxy/domain";
import { failure, success, type Result } from "@proxy/shared-types";

export const PROFILE_FILE_EXTENSION = ".proxy-profile.json";

export interface ProfileDocument {
  formatVersion: 1;
  kind: "proxy-voice-profile";
  profile: VoiceProfile;
}

const now = Date.UTC(2026, 2, 14);

export const defaultProfileDocument: ProfileDocument = {
  formatVersion: 1,
  kind: "proxy-voice-profile",
  profile: {
    metadata: {
      id: "profile:default",
      name: "Default Proxy Voice",
      description: "Calm, direct, and constraints-aware baseline profile.",
      tags: ["default", "calm", "local-first"],
      createdAt: now,
      updatedAt: now
    },
    tone: "calm, precise, and grounded",
    audience: "general",
    rewriteDirectives: [
      "Prefer direct phrasing over hype.",
      "Reduce unnecessary filler before the user sees output."
    ],
    hardConstraints: [
      "Do not present provider capability as local authority.",
      "Do not bypass validation or policy steps."
    ],
    rules: [
      {
        kind: "style",
        label: "Calm tone",
        instruction: "Favor measured language and plain claims."
      },
      {
        kind: "constraint",
        label: "Voice authority stays local",
        instruction: "Treat upstream responses as drafts until rewritten and validated."
      }
    ],
    defaultProviderId: "provider:local-default"
  }
};

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

export const parseProfileDocument = (
  input: string | ProfileDocument
): Result<ProfileDocument> => {
  try {
    const parsed = typeof input === "string" ? JSON.parse(input) : input;

    if (parsed?.kind !== "proxy-voice-profile" || parsed?.formatVersion !== 1) {
      return failure("Unsupported profile document format.");
    }

    return success(parsed as ProfileDocument);
  } catch {
    return failure("Profile document is not valid JSON.");
  }
};
