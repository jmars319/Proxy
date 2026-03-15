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
  generateDraft(prompt: string): Promise<ProviderGenerateResult>;
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

  async generateDraft(prompt: string): Promise<ProviderGenerateResult> {
    return {
      text: `Sure! Here's a helpful response to your question: ${prompt}. As an AI language model, I apologize. The clearest next step is to focus on the main idea, remove extra filler, and respond directly.`,
      latencyMs: 48
    };
  }

  async generate(request: GenerationRequest): Promise<ProviderGenerateResult> {
    return this.generateDraft(request.prompt);
  }
}

export const generateDraft = async (
  prompt: string,
  provider: ProviderAdapter = new MockProvider()
): Promise<ProviderGenerateResult> => provider.generateDraft(prompt);

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
