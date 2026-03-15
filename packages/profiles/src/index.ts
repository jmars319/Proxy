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
      name: "Default",
      description: "Clear, calm, and direct baseline voice for Proxy.",
      tags: ["default", "calm", "local-first"],
      createdAt: now,
      updatedAt: now
    },
    tone: "clear, calm, direct",
    audience: "general",
    bannedPhrases: ["As an AI language model", "I apologize"],
    styleRules: ["avoid filler", "prefer short sentences"],
    rewriteDirectives: ["avoid filler", "prefer short sentences"],
    hardConstraints: [
      "Do not let provider voice override the profile.",
      "Do not bypass validation before output is shown."
    ],
    rules: [
      {
        kind: "style",
        label: "Avoid filler",
        instruction: "Cut generic lead-ins and redundant words."
      },
      {
        kind: "constraint",
        label: "Prefer short sentences",
        instruction: "Keep the final output concise and easier to scan."
      }
    ],
    defaultProviderId: "provider:local-default"
  }
};

const cloneProfile = (input: ProfileDocument["profile"]): ProfileDocument["profile"] =>
  JSON.parse(JSON.stringify(input)) as ProfileDocument["profile"];

export const loadDefaultProfile = (): VoiceProfile => cloneProfile(defaultProfileDocument.profile);

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
