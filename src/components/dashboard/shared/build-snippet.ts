import type { CodeLang } from "@/lib/code-highlight";

export type SnippetLang = "curl" | "python" | "ts";

/** `code` is the colouring grammar of the snippet (a cURL command is a shell script). */
export const snippetLangs: { lang: SnippetLang; label: string; file: string; code: CodeLang }[] = [
  { lang: "curl", label: "cURL", file: "request.sh", code: "bash" },
  { lang: "python", label: "Python", file: "main.py", code: "python" },
  { lang: "ts", label: "TypeScript", file: "index.ts", code: "ts" },
];

/** First chat request for the chosen model, in the chosen language; the key always comes from NBYTES_API_KEY. */
export function buildSnippet(lang: SnippetLang, modelId: string, baseUrl: string): string {
  if (lang === "curl") {
    return `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer $NBYTES_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${modelId}", "messages": [{"role": "user", "content": "Halo"}]}'`;
  }
  if (lang === "python") {
    return `import os
from openai import OpenAI

client = OpenAI(base_url="${baseUrl}", api_key=os.environ["NBYTES_API_KEY"])
reply = client.chat.completions.create(
    model="${modelId}",
    messages=[{"role": "user", "content": "Halo"}],
)
print(reply.choices[0].message.content)`;
  }
  return `import OpenAI from "openai";

const client = new OpenAI({ baseURL: "${baseUrl}", apiKey: process.env.NBYTES_API_KEY });
const reply = await client.chat.completions.create({
  model: "${modelId}",
  messages: [{ role: "user", content: "Halo" }],
});
console.log(reply.choices[0].message.content);`;
}
