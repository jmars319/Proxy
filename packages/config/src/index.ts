import type { ProviderId } from "@proxy/shared-types";

export const APP_NAME = "Proxy";
export const REPO_NAME = "Proxy by JAMARQ";
export const BRAND_NAME = "JAMARQ";

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
