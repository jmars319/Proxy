import type { SuiteProfilePresetOverrides } from "@proxy/config";
import fs from "node:fs";
import path from "node:path";

const storePath = path.resolve(process.env.PROXY_SUITE_PROFILE_STORE_PATH ?? ".tenra-proxy-suite-profile-overrides.json");
const healthHistoryPath = path.resolve(process.env.PROXY_SUITE_HEALTH_HISTORY_PATH ?? ".tenra-proxy-suite-health-history.json");

function isOverrides(value: unknown): value is SuiteProfilePresetOverrides {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function validateSuiteProfilePresetOverrides(overrides: SuiteProfilePresetOverrides): string[] {
  const errors: string[] = [];

  for (const [key, override] of Object.entries(overrides)) {
    if (!key.trim()) {
      errors.push("Override keys must be non-empty.");
    }
    if (!override || typeof override !== "object" || Array.isArray(override)) {
      errors.push(`${key} override must be an object.`);
      continue;
    }
    if (override.profileId != null && (typeof override.profileId !== "string" || !override.profileId.trim())) {
      errors.push(`${key}.profileId must be a non-empty string when provided.`);
    }
    if (
      override.hardConstraints != null &&
      (!Array.isArray(override.hardConstraints) ||
        override.hardConstraints.some((constraint) => typeof constraint !== "string" || !constraint.trim()))
    ) {
      errors.push(`${key}.hardConstraints must be an array of non-empty strings.`);
    }
  }

  return errors;
}

export function readPersistedSuiteProfilePresetOverrides(): SuiteProfilePresetOverrides {
  if (!fs.existsSync(storePath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(storePath, "utf8")) as { overrides?: unknown };
    return isOverrides(parsed.overrides) ? parsed.overrides : {};
  } catch {
    return {};
  }
}

export function writePersistedSuiteProfilePresetOverrides(overrides: SuiteProfilePresetOverrides) {
  const errors = validateSuiteProfilePresetOverrides(overrides);
  if (errors.length) {
    throw new Error(errors.join("; "));
  }

  fs.writeFileSync(
    storePath,
    JSON.stringify(
      {
        schema: "tenra-proxy.suite-profile-overrides.v1",
        updatedAt: new Date().toISOString(),
        overrides
      },
      null,
      2
    )
  );
  return readPersistedSuiteProfilePresetOverrides();
}

export function resetPersistedSuiteProfilePresetOverrides() {
  if (fs.existsSync(storePath)) {
    fs.unlinkSync(storePath);
  }
  return {};
}

export type SuiteHealthHistoryEntry = {
  checkedAt: string;
  ok: boolean;
  endpoints: Record<string, string>;
  allowedOrigins: string[];
};

export function appendSuiteHealthHistory(entry: SuiteHealthHistoryEntry): SuiteHealthHistoryEntry[] {
  let history: SuiteHealthHistoryEntry[];
  try {
    const parsed = fs.existsSync(healthHistoryPath)
      ? (JSON.parse(fs.readFileSync(healthHistoryPath, "utf8")) as { history?: SuiteHealthHistoryEntry[] }).history
      : [];
    history = Array.isArray(parsed) ? parsed : [];
  } catch {
    history = [];
  }
  const next = [entry, ...history].slice(0, 50);
  fs.writeFileSync(
    healthHistoryPath,
    JSON.stringify(
      {
        schema: "tenra-proxy.suite-health-history.v1",
        updatedAt: new Date().toISOString(),
        history: next
      },
      null,
      2
    )
  );
  return next;
}

export function readSuiteHealthHistory(): SuiteHealthHistoryEntry[] {
  if (!fs.existsSync(healthHistoryPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(healthHistoryPath, "utf8")) as { history?: SuiteHealthHistoryEntry[] };
    return Array.isArray(parsed.history) ? parsed.history : [];
  } catch {
    return [];
  }
}
