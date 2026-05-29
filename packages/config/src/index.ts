import type { ProviderId } from "@proxy/shared-types";

export const APP_NAME = "tenra Proxy";
export const REPO_NAME = "tenra Proxy";
export const BRAND_NAME = "tenra";

export interface AppEnvironment {
  appName: string;
  appEnv: string;
  defaultProvider?: ProviderId;
  allowCloudEscalation: boolean;
  localProfilePath?: string;
  localStoragePath?: string;
  sentryDsn?: string;
}

export interface ProviderFeatureFlags {
  localProviders: boolean;
  openai: boolean;
  anthropic: boolean;
  google: boolean;
}

export interface SuiteEndpointConfig {
  allowedOrigins: string[];
}

export interface SuiteProfilePresetOverride {
  profileId?: string | undefined;
  hardConstraints?: string[] | undefined;
}

export type SuiteProfilePresetOverrides = Record<string, SuiteProfilePresetOverride>;

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (!value) {
    return fallback;
  }

  return value === "true";
};

export const readAppEnvironment = (
  source: Record<string, string | undefined>
): AppEnvironment => ({
  appName: source.APP_NAME ?? APP_NAME,
  appEnv: source.APP_ENV ?? "development",
  defaultProvider: source.DEFAULT_PROVIDER as ProviderId | undefined,
  allowCloudEscalation: parseBoolean(source.ALLOW_CLOUD_ESCALATION, false),
  localProfilePath: source.LOCAL_PROFILE_PATH,
  localStoragePath: source.LOCAL_STORAGE_PATH,
  sentryDsn: source.SENTRY_DSN
});

export const readProviderFeatureFlags = (
  source: Record<string, string | undefined>
): ProviderFeatureFlags => ({
  localProviders: true,
  openai: Boolean(source.OPENAI_API_KEY),
  anthropic: Boolean(source.ANTHROPIC_API_KEY),
  google: Boolean(source.GOOGLE_API_KEY)
});

const defaultSuiteAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:5176",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5176"
];

export const readSuiteEndpointConfig = (
  source: Record<string, string | undefined>
): SuiteEndpointConfig => ({
  allowedOrigins: (source.PROXY_SUITE_ALLOWED_ORIGINS ?? defaultSuiteAllowedOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
});

export const readSuiteProfilePresetOverrides = (
  source: Record<string, string | undefined>
): SuiteProfilePresetOverrides => {
  if (!source.PROXY_SUITE_PROFILE_PRESETS) {
    return {};
  }

  try {
    const parsed = JSON.parse(source.PROXY_SUITE_PROFILE_PRESETS) as SuiteProfilePresetOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};
