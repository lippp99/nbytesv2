// Draft API reference content: the OpenAI-compatible surface nbytes promises. Final list comes with the backend PRD.
import { BASE_URL } from "@/lib/model-catalog";

export type Param = { name: string; type: string; required: boolean; body: string };

export const chatParams: Param[] = [
  { name: "model", type: "string", required: true, body: "Id model dari daftar model, misalnya gpt-5." },
  { name: "messages", type: "array", required: true, body: "Percakapan berurutan. Tiap item punya role (system, user, assistant) dan content." },
  { name: "temperature", type: "number", required: false, body: "0 sampai 2. Rendah untuk jawaban konsisten, tinggi untuk variasi." },
  { name: "max_tokens", type: "integer", required: false, body: "Batas token jawaban. Biaya dihitung dari token yang benar-benar dipakai." },
  { name: "stream", type: "boolean", required: false, body: "true untuk menerima jawaban bertahap sebagai server-sent events." },
];

export const modelFields: Param[] = [
  { name: "data[].id", type: "string", required: true, body: "Nilai yang dipakai di field model." },
  { name: "data[].owned_by", type: "string", required: true, body: "Provider model, misalnya openai atau anthropic." },
];

export const errors = [
  { code: "400", meaning: "Body tidak valid atau model tidak dikenal.", action: "Periksa field model dan messages." },
  { code: "401", meaning: "API key tidak ada, salah, atau sudah dicabut.", action: "Periksa header Authorization dan status key." },
  { code: "402", meaning: "Batas anggaran bulanan key tercapai.", action: "Naikkan batas di API Keys atau tunggu periode berikutnya." },
  { code: "429", meaning: "Terlalu banyak request dalam waktu singkat.", action: "Kurangi laju request, lalu coba lagi setelah jeda." },
  { code: "502", meaning: "Provider model sedang gangguan.", action: "Coba lagi, atau pindah ke model lain untuk sementara." },
];

export const authHeader = "Authorization: Bearer $NBYTES_API_KEY";

export const modelsRequest = `curl ${BASE_URL}/models \\
  -H "Authorization: Bearer $NBYTES_API_KEY"`;

export const chatResponse = `{
  "id": "chatcmpl-8f2c41",
  "object": "chat.completion",
  "model": "gpt-5",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Halo! Ada yang bisa saya bantu?" },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 9, "completion_tokens": 10, "total_tokens": 19 }
}`;

export const modelsResponse = `{
  "object": "list",
  "data": [
    { "id": "gpt-5", "object": "model", "owned_by": "openai" },
    { "id": "claude-sonnet-4.5", "object": "model", "owned_by": "anthropic" }
  ]
}`;

export const errorResponse = `{
  "error": {
    "message": "API key tidak valid atau sudah dicabut.",
    "type": "authentication_error"
  }
}`;
