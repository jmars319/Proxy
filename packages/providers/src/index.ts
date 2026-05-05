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
  label: "Local Preview Provider",
  mode: "local",
  enabled: true
};

export const cloudProviderPlaceholder: ProviderDescriptor = {
  id: "provider:cloud-placeholder",
  label: "Cloud Provider Reserved",
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

const cleanPrompt = (prompt: string) => prompt.replace(/\s+/g, " ").trim();

export class LocalRuleProvider implements ProviderAdapter {
  descriptor: ProviderDescriptor = {
    ...localProviderPlaceholder,
    label: "Local Rule Provider"
  };

  async generateDraft(prompt: string): Promise<ProviderGenerateResult> {
    const startedAt = Date.now();
    const normalized = cleanPrompt(prompt);
    const text = [
      normalized
        ? `Here is a direct local draft for: ${normalized}`
        : "Here is a direct local draft.",
      "Main point: keep the response specific, grounded, and easy to review.",
      "Next step: check the wording against the active voice profile before sending."
    ].join(" ");

    return {
      text,
      latencyMs: Math.max(1, Date.now() - startedAt)
    };
  }

  async generate(request: GenerationRequest): Promise<ProviderGenerateResult> {
    return this.generateDraft(request.prompt);
  }
}

export class OllamaProvider implements ProviderAdapter {
  descriptor: ProviderDescriptor = {
    id: "provider:ollama-local",
    label: "Local Ollama Provider",
    mode: "local",
    enabled: true
  };

  readonly #baseUrl: string;
  readonly #model: string;

  constructor(options: { baseUrl?: string; model?: string } = {}) {
    this.#baseUrl = (options.baseUrl ?? "http://127.0.0.1:11434").replace(/\/+$/, "");
    this.#model = options.model ?? "llama3.2";
  }

  async generateDraft(prompt: string): Promise<ProviderGenerateResult> {
    const startedAt = Date.now();
    const response = await fetch(`${this.#baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.#model,
        prompt: cleanPrompt(prompt),
        stream: false
      })
    });
    const payload = (await response.json().catch(() => null)) as { response?: unknown; error?: unknown } | null;

    if (!response.ok) {
      const message = typeof payload?.error === "string" ? payload.error : `Ollama returned HTTP ${response.status}.`;
      throw new Error(message);
    }

    if (typeof payload?.response !== "string" || !payload.response.trim()) {
      throw new Error("Ollama returned no draft text.");
    }

    return {
      text: payload.response.trim(),
      latencyMs: Math.max(1, Date.now() - startedAt)
    };
  }

  async generate(request: GenerationRequest): Promise<ProviderGenerateResult> {
    return this.generateDraft(request.prompt);
  }
}

export const createDefaultProvider = (
  source: Record<string, string | undefined> = {}
): ProviderAdapter => {
  const provider = source.PROXY_PROVIDER?.trim().toLowerCase() ?? source.VITE_PROXY_PROVIDER?.trim().toLowerCase();

  if (provider === "ollama") {
    return new OllamaProvider({
      baseUrl: source.PROXY_OLLAMA_BASE_URL ?? source.VITE_PROXY_OLLAMA_BASE_URL,
      model: source.PROXY_OLLAMA_MODEL ?? source.VITE_PROXY_OLLAMA_MODEL
    });
  }

  return new LocalRuleProvider();
};

export const generateDraft = async (
  prompt: string,
  provider: ProviderAdapter = new LocalRuleProvider()
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
