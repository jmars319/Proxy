import type { SuiteProfilePresetOverrides } from "@proxy/config";
import fs from "node:fs";
import path from "node:path";

const storePath = path.resolve(process.env.PROXY_SUITE_PROFILE_STORE_PATH ?? ".tenra-proxy-suite-profile-overrides.json");

function isOverrides(value: unknown): value is SuiteProfilePresetOverrides {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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
