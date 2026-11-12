// API reference content, matched to the API as built (PRD dashboard-docs §2.2). Examples that echo server output are
// generated from the same functions the server uses, so they cannot drift.
import { microsPerMToUsdPerToken } from "@/lib/gateway/catalog-contract";
import { openAiErrorBody } from "@/lib/gateway/error-contract";

export type Param = { name: string; type: string; required: boolean; body: string };

export const chatParams: Param[] = [
  { name: "model", type: "string", required: true, body: "Id persis dari daftar model. Alias (mis. anthropic/…, -latest) ditolak 404." },
  { name: "messages", type: "array", required: true, body: "Percakapan berurutan; tiap item objek dengan role dan content." },
  { name: "stream", type: "boolean", required: false, body: "true untuk menerima jawaban bertahap (lihat Streaming)." },
  { name: "max_completion_tokens", type: "integer", required: false, body: "Batas token jawaban. Didahulukan dari max_tokens bila keduanya ada." },
  { name: "max_tokens", type: "integer", required: false, body: "Batas token jawaban (nama lama). Bilangan bulat positif." },
  { name: "stream_options", type: "object", required: false, body: "Saat streaming, include_usage selalu diisi true oleh nbytes." },
  { name: "temperature, top_p, tools, …", type: "—", required: false,
    body: "Field lain diteruskan ke model apa adanya, kecuali field routing (lihat bawah)." },
];

export const modelFields: Param[] = [
  { name: "data[].id", type: "string", required: true, body: "Nilai untuk field model." },
  { name: "data[].name", type: "string", required: true, body: "Nama tampilan model." },
  { name: "data[].owned_by", type: "string", required: true, body: "Selalu \"nbytes\"." },
  { name: "data[].created", type: "integer", required: true, body: "Waktu model masuk katalog, detik Unix." },
  { name: "data[].context_length", type: "integer | null", required: true, body: "Panjang konteks dalam token, null bila tidak diketahui." },
  { name: "data[].pricing.prompt", type: "string", required: true, body: "Harga input dalam USD per token (desimal, 12 angka di belakang koma)." },
  { name: "data[].pricing.completion", type: "string", required: true, body: "Harga output dalam USD per token." },
];

export const authHeader = "Authorization: Bearer $NBYTES_API_KEY";
export const altAuthHeader = "x-api-key: $NBYTES_API_KEY";

export const modelsRequest = (baseUrl: string) => `curl ${baseUrl}/models \\
  -H "Authorization: Bearer $NBYTES_API_KEY"`;

const examplePricing = { prompt: microsPerMToUsdPerToken(3_000_000), completion: microsPerMToUsdPerToken(15_000_000) };
export const modelsResponse = JSON.stringify({
  object: "list",
  data: [{
    id: "claude-sonnet-4.5", object: "model", created: 1762905600, owned_by: "nbytes", name: "Claude Sonnet 4.5",
    context_length: 200000, pricing: examplePricing,
  }],
}, null, 2);

export const chatResponse = `{
  "id": "chatcmpl-8f2c41",
  "object": "chat.completion",
  "model": "claude-sonnet-4.5",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Halo! Ada yang bisa saya bantu?" },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 9, "completion_tokens": 10, "total_tokens": 19 }
}`;

export const streamRequest = (baseUrl: string) => `curl -N ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer $NBYTES_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "claude-sonnet-4.5", "stream": true, "messages": [{"role": "user", "content": "Halo"}]}'`;

export const streamResponse = `data: {"choices":[{"index":0,"delta":{"content":"Halo"}}]}

data: {"choices":[{"index":0,"delta":{"content":"! Ada yang bisa"}}]}

data: {"choices":[],"usage":{"prompt_tokens":9,"completion_tokens":10,"total_tokens":19}}

data: [DONE]`;

export const errorResponse = JSON.stringify(openAiErrorBody("model_not_found", "model"), null, 2);
