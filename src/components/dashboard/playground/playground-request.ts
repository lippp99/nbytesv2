export type Role = "system" | "user" | "assistant";
export type RequestMessage = { role: Role; content: string };
export type RequestParams = { model: string; temperature: number; maxTokens: number };

/** Messages sent to the API: the system prompt (if any) first, then the conversation in order. */
export function buildMessages(system: string, history: RequestMessage[]): RequestMessage[] {
  const head: RequestMessage[] = system.trim() ? [{ role: "system", content: system.trim() }] : [];
  return [...head, ...history];
}

/** OpenAI-compatible chat completions body, with the playground's parameters. */
export function requestBody(params: RequestParams, messages: RequestMessage[]) {
  return { model: params.model, messages, temperature: params.temperature, max_tokens: params.maxTokens };
}

/** The same request as a cURL command; single quotes in the JSON are escaped for the shell. */
export function curlCommand(baseUrl: string, body: object): string {
  const json = JSON.stringify(body, null, 2).replace(/'/g, "'\\''");
  return `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer $NBYTES_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${json}'`;
}
