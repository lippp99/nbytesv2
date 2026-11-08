// Coding tools and their setup for an OpenAI-compatible provider. Formats follow what jatevo.ai shows for the same
// tools (checked 2026-11-08); each tool's own docs are the source of truth before release (not verified here).
import { BASE_URL, type Model } from "@/lib/model-catalog";

export type Tool = { id: string; name: string; icon: string | null };
export type Setup = { file: string; lang: "json" | "yaml" | "toml" | "sh"; note: string; text?: string; pairs?: [string, string][] };

// icon = LobeHub mono SVG in public/models/; null = no icon there (Continue, Zed, Aider), a letter tile instead
export const tools: Tool[] = [
  { id: "codex", name: "Codex", icon: "codex" },
  { id: "opencode", name: "OpenCode", icon: "opencode" },
  { id: "hermes", name: "Hermes Agent", icon: "nousresearch" },
  { id: "openclaw", name: "OpenClaw", icon: "openclaw" },
  { id: "cline", name: "Cline", icon: "cline" },
  { id: "roo", name: "Roo Code", icon: "roocode" },
  { id: "kilo", name: "Kilo Code", icon: "kilocode" },
  { id: "continue", name: "Continue", icon: null },
  { id: "zed", name: "Zed", icon: null },
  { id: "aider", name: "Aider", icon: null },
  { id: "qwencode", name: "Qwen Code", icon: "qwen" },
];

/** Codex talks to providers over the Responses API, which only the OpenAI models answer in this mock. */
export const responsesOnly = new Set(["codex"]);
export const speaksResponses = (m: Model) => m.providerId === "openai";

const ENV = "NBYTES_API_KEY";
const json = (value: unknown) => JSON.stringify(value, null, 2);
const settings = (m: Model): [string, string][] => [
  ["API Provider", "OpenAI Compatible"],
  ["Base URL", BASE_URL],
  ["API Key", "key Anda"],
  ["Model ID", m.id],
];

export const setups: Record<string, (m: Model) => Setup> = {
  codex: (m) => ({ file: "~/.codex/config.toml", lang: "toml", note: `Simpan di ~/.codex/config.toml, lalu isi ${ENV} dengan key Anda.`,
    text: [`model = "${m.id}"`, 'model_provider = "nbytes"', "", "[model_providers.nbytes]", 'name = "nbytes"',
      `base_url = "${BASE_URL}"`, `env_key = "${ENV}"`, 'wire_api = "responses"'].join("\n") }),
  opencode: (m) => ({ file: "opencode.json", lang: "json", note: `Simpan sebagai opencode.json di proyek Anda, lalu isi ${ENV}.`,
    text: json({ $schema: "https://opencode.ai/config.json", provider: { nbytes: { npm: "@ai-sdk/openai-compatible", name: "nbytes",
      options: { baseURL: BASE_URL, apiKey: `{env:${ENV}}` }, models: { [m.id]: { name: m.name } } } } }) }),
  hermes: (m) => ({ file: "~/.hermes/config.yaml", lang: "yaml", note: `Simpan di ~/.hermes/config.yaml, lalu isi ${ENV} dengan key Anda.`,
    text: ["model:", `  default: ${m.id}`, "  provider: custom", `  base_url: ${BASE_URL}`, `  key_env: ${ENV}`].join("\n") }),
  openclaw: (m) => ({ file: "~/.openclaw/openclaw.json", lang: "json", note: `Gabungkan ke ~/.openclaw/openclaw.json dan isi ${ENV} di mesin gateway.`,
    text: json({ agents: { defaults: { model: { primary: `nbytes/${m.id}` } } }, models: { mode: "merge", providers: { nbytes: {
      baseUrl: BASE_URL, apiKey: `\${${ENV}}`, api: "openai-completions",
      models: [{ id: m.id, name: m.name, reasoning: m.capabilities.includes("reasoning"), contextWindow: m.contextTokens }] } } } }) }),
  cline: (m) => ({ file: "Pengaturan Cline", lang: "json", note: "Buka pengaturan Cline dan isi empat kolom ini.", pairs: settings(m) }),
  roo: (m) => ({ file: "Pengaturan Roo Code", lang: "json", note: "Buka pengaturan Roo Code dan isi empat kolom ini.", pairs: settings(m) }),
  kilo: (m) => ({ file: "Pengaturan Kilo Code", lang: "json", note: "Buka pengaturan Kilo Code dan isi empat kolom ini.", pairs: settings(m) }),
  continue: (m) => ({ file: "config.yaml", lang: "yaml", note: "Tambahkan ke config.yaml Continue dan isi apiKey dengan key Anda.",
    text: ["models:", `  - name: ${m.name} (nbytes)`, "    provider: openai", `    model: ${m.id}`, `    apiBase: ${BASE_URL}`,
      "    apiKey: KEY_ANDA"].join("\n") }),
  zed: (m) => ({ file: "Zed settings.json", lang: "json", note: `Tambahkan ke settings.json Zed, lalu isi ${ENV} atau tempel key di Agent settings.`,
    text: json({ language_models: { openai_compatible: { nbytes: { api_url: BASE_URL,
      available_models: [{ name: m.id, display_name: m.name, max_tokens: m.contextTokens }] } } } }) }),
  aider: (m) => ({ file: "Terminal", lang: "sh", note: "Jalankan di terminal, ganti KEY_ANDA dengan key Anda.",
    text: [`export OPENAI_API_BASE=${BASE_URL}`, "export OPENAI_API_KEY=KEY_ANDA", `aider --model openai/${m.id}`].join("\n") }),
  qwencode: (m) => ({ file: "~/.qwen/settings.json", lang: "json", note: `Simpan di ~/.qwen/settings.json, lalu isi ${ENV} dengan key Anda.`,
    text: json({ modelProviders: { openai: [{ id: m.id, name: `${m.name} (nbytes)`, envKey: ENV, baseUrl: BASE_URL }] },
      security: { auth: { selectedType: "openai" } }, model: { name: m.id } }) }),
};

/** Plain text of a setup, for the copy button. */
export const setupText = (s: Setup) => (s.pairs ? s.pairs.map(([k, v]) => `${k}: ${v}`).join("\n") : (s.text ?? ""));
