// Mock data for the landing UI only (PRD §6). The model catalog itself lives in lib/model-catalog.ts.
import { BASE_URL } from "@/lib/model-catalog";

export type CodeLang = "curl" | "python" | "ts";

/** Models shown in the hero price chart, in display order. */
export const chartModelIds = [
  "claude-sonnet-4.5", "gpt-5", "gemini-2.5-pro", "qwen3-max", "kimi-k2", "gpt-5-mini", "llama-4-maverick", "deepseek-v3.2",
];

// {{model}} is replaced with the model picked in the code panel.
export const mockCodeSamples: { lang: CodeLang; label: string; code: string }[] = [
  { lang: "curl", label: "cURL", code: `# Isi NBYTES_API_KEY dengan key Anda sebelum menjalankan contoh ini.
curl ${BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $NBYTES_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "{{model}}", "messages": [{"role": "user", "content": "Halo"}]}'` },
  { lang: "python", label: "Python", code: `import os
from openai import OpenAI

client = OpenAI(base_url="${BASE_URL}", api_key=os.environ["NBYTES_API_KEY"])

reply = client.chat.completions.create(
    model="{{model}}",
    messages=[{"role": "user", "content": "Halo"}],
)
print(reply.choices[0].message.content)` },
  { lang: "ts", label: "TypeScript", code: `import OpenAI from "openai";

const client = new OpenAI({ baseURL: "${BASE_URL}", apiKey: process.env.NBYTES_API_KEY });

const reply = await client.chat.completions.create({
  model: "{{model}}",
  messages: [{ role: "user", content: "Halo" }],
});
console.log(reply.choices[0].message.content);` },
];

export const mockFaq = [
  { q: "Apakah kode lama saya perlu diubah?",
    a: "Tidak banyak. Endpoint mengikuti format chat completions OpenAI, jadi cukup ganti base URL dan API key di SDK yang sudah Anda pakai." },
  { q: "Model apa saja yang bisa dipanggil?",
    a: "Daftar di halaman ini adalah contoh. Daftar model final ditentukan saat peluncuran." },
  { q: "Bagaimana biaya dihitung?",
    a: "Per token input dan output, sesuai harga tiap model. Setiap request mencatat jumlah token dan biayanya." },
  { q: "Apa yang terjadi kalau satu provider sedang gangguan?",
    a: "Anda bisa menentukan urutan cadangan. Jika provider pertama membalas error atau batas rate, request diteruskan ke provider berikutnya." },
  { q: "Bisakah saya membatasi pemakaian per key?",
    a: "Bisa. Setiap key punya batas anggaran bulanan. Request ditolak setelah batas tercapai." },
  { q: "Apakah isi prompt disimpan?",
    a: "Yang dicatat hanya metadata request: waktu, model, jumlah token, status, dan biaya." },
  { q: "Bagaimana cara membuat akun?",
    a: "Masuk dengan email. Kode 8 digit yang dikirim ke email sekaligus membuat akun baru." },
];
