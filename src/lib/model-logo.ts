// Which logo in public/models/ belongs to a model. Model rows store no provider, so the family name in the model id
// or catalog name decides (e.g. "deepseek-v3.1" -> deepseek). First match wins; no match means no logo, never a guess.
// shortcut: keyword list by hand; store the Surplus `provider` with the model once more families need logos.

const RULES: [RegExp, string][] = [
  [/claude/, "claude"],
  [/gpt|openai/, "openai"],
  [/gemini/, "gemini"],
  [/gemma/, "google"],
  [/deepseek/, "deepseek"],
  [/qwen|qwq/, "qwen"],
  [/mistral|devstral|codestral|magistral|ministral|pixtral/, "mistral"],
  [/llama/, "meta"],
  [/grok/, "grok"],
  [/kimi/, "kimi"],
  [/moonshot/, "moonshot"],
  [/glm/, "chatglm"],
  [/hermes|nousresearch/, "nousresearch"],
];

/** The logo file name (without .svg) for a model, or null when no rule matches. */
export function modelLogo(modelId: string, name?: string | null): string | null {
  const text = `${modelId} ${name ?? ""}`.toLowerCase();
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}
