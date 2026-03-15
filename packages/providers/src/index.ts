import type { GenerationRequest, ProviderRoutingResult } from "@proxy/domain";
import type { ProviderId } from "@proxy/shared-types";

export interface ProviderDescriptor {
  id: ProviderId;
  label: string;
  mode: "local" | "cloud";
  enabled: boolean;
}

export interface ProviderGenerateResult {
  text: string;
  latencyMs: number;
}

export interface ProviderAdapter {
  descriptor: ProviderDescriptor;
  generate(request: GenerationRequest): Promise<ProviderGenerateResult>;
}

export const localProviderPlaceholder: ProviderDescriptor = {
  id: "provider:local-default",
  label: "Local Placeholder Provider",
  mode: "local",
  enabled: true
};

export const cloudProviderPlaceholder: ProviderDescriptor = {
  id: "provider:cloud-placeholder",
  label: "Cloud Placeholder Provider",
  mode: "cloud",
  enabled: false
};

export class MockProvider implements ProviderAdapter {
  descriptor: ProviderDescriptor = localProviderPlaceholder;

  async generate(request: GenerationRequest): Promise<ProviderGenerateResult> {
    return {
      text: `Mock draft for profile ${request.profileId}: ${request.prompt}`,
      latencyMs: 12
    };
  }
}

export const routeProvider = (
  providerId: ProviderId,
  mode: "local" | "cloud",
  reason: string,
  fallbackProviderId?: ProviderId
): ProviderRoutingResult => ({
  providerId,
  mode,
  reason,
  fallbackProviderId
});
