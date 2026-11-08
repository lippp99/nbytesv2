// Mock model catalog shared by the landing page and the dashboard (PRD §6). Every number is an example; replace
// before public release. Prices are integer micro-dollars. Icons are file ids in public/models/ (LobeHub mono SVG).

export type Provider = { id: string; name: string; icon: string };
export type Capability = "tools" | "vision" | "reasoning" | "json" | "streaming";
export type Model = {
  id: string;
  name: string;
  providerId: string;
  icon: string;
  contextTokens: number;
  inputPerMTokMicros: number;
  outputPerMTokMicros: number;
  capabilities: Capability[];
};
export const BASE_URL = "https://api.example.com/v1";

export const mockProviders: Provider[] = [
  { id: "openai", name: "OpenAI", icon: "openai" },
  { id: "anthropic", name: "Anthropic", icon: "anthropic" },
  { id: "google", name: "Google", icon: "google" },
  { id: "meta", name: "Meta", icon: "meta" },
  { id: "mistral", name: "Mistral AI", icon: "mistral" },
  { id: "deepseek", name: "DeepSeek", icon: "deepseek" },
  { id: "qwen", name: "Alibaba Qwen", icon: "qwen" },
  { id: "moonshot", name: "Moonshot AI", icon: "moonshot" },
  { id: "zhipu", name: "Zhipu AI", icon: "zhipu" },
  { id: "xai", name: "xAI", icon: "xai" },
];

const all: Capability[] = ["tools", "vision", "reasoning", "streaming"];

export const mockModels: Model[] = [
  { id: "gpt-5", name: "GPT-5", providerId: "openai", icon: "openai", contextTokens: 400_000,
    inputPerMTokMicros: 1_250_000, outputPerMTokMicros: 10_000_000, capabilities: all },
  { id: "gpt-5-mini", name: "GPT-5 mini", providerId: "openai", icon: "openai", contextTokens: 400_000,
    inputPerMTokMicros: 250_000, outputPerMTokMicros: 2_000_000, capabilities: ["tools", "json", "streaming"] },
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", providerId: "anthropic", icon: "claude", contextTokens: 200_000,
    inputPerMTokMicros: 3_000_000, outputPerMTokMicros: 15_000_000, capabilities: all },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", providerId: "anthropic", icon: "claude", contextTokens: 200_000,
    inputPerMTokMicros: 1_000_000, outputPerMTokMicros: 5_000_000, capabilities: ["tools", "vision", "streaming"] },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", providerId: "google", icon: "gemini", contextTokens: 1_000_000,
    inputPerMTokMicros: 1_250_000, outputPerMTokMicros: 10_000_000, capabilities: all },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", providerId: "meta", icon: "meta", contextTokens: 1_000_000,
    inputPerMTokMicros: 270_000, outputPerMTokMicros: 850_000, capabilities: ["vision", "streaming"] },
  { id: "mistral-medium-3", name: "Mistral Medium 3", providerId: "mistral", icon: "mistral", contextTokens: 128_000,
    inputPerMTokMicros: 400_000, outputPerMTokMicros: 2_000_000, capabilities: ["tools", "json", "streaming"] },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", providerId: "deepseek", icon: "deepseek", contextTokens: 128_000,
    inputPerMTokMicros: 280_000, outputPerMTokMicros: 420_000, capabilities: ["tools", "reasoning", "streaming"] },
  { id: "qwen3-max", name: "Qwen3 Max", providerId: "qwen", icon: "qwen", contextTokens: 256_000,
    inputPerMTokMicros: 1_200_000, outputPerMTokMicros: 6_000_000, capabilities: ["tools", "json", "streaming"] },
  { id: "kimi-k2", name: "Kimi K2", providerId: "moonshot", icon: "kimi", contextTokens: 256_000,
    inputPerMTokMicros: 600_000, outputPerMTokMicros: 2_500_000, capabilities: ["tools", "reasoning", "streaming"] },
  { id: "glm-4.6", name: "GLM-4.6", providerId: "zhipu", icon: "chatglm", contextTokens: 200_000,
    inputPerMTokMicros: 600_000, outputPerMTokMicros: 2_200_000, capabilities: ["tools", "streaming"] },
  { id: "grok-4", name: "Grok 4", providerId: "xai", icon: "grok", contextTokens: 256_000,
    inputPerMTokMicros: 3_000_000, outputPerMTokMicros: 15_000_000, capabilities: ["vision", "reasoning", "streaming"] },
];

export const capabilityLabels: Record<Capability, string> = {
  tools: "Tool calling",
  vision: "Input gambar",
  reasoning: "Reasoning",
  json: "JSON mode",
  streaming: "Streaming",
};

export function modelById(id: string): Model | undefined {
  return mockModels.find((model) => model.id === id);
}

export function providerById(id: string): Provider | undefined {
  return mockProviders.find((provider) => provider.id === id);
}
