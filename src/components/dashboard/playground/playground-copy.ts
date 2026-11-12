import type { PlaygroundError } from "@/lib/playground/playground-client";

// Text of the Playground page.
export const playground = {
  title: "Playground",
  sub: "Uji model dan parameter sebelum menulis kode. Percakapan ini bisa disalin sebagai request API.",
  loading: "Memuat Playground",
  you: "Anda",
  session: "Sesi ini",
  tokens: "token",
  clear: "Bersihkan",
  context: "konteks",
  maxOutput: "maks output",
  empty: {
    title: (model: string) => `Uji ${model} sebelum menulis kode`,
    body: "Atur parameter di panel kanan, lalu kirim pesan. Request API untuk percakapan ini ada di tab Kode.",
    suggestions: [
      "Ringkas teks berikut menjadi tiga poin singkat:",
      "Tulis fungsi Python yang memvalidasi alamat email.",
      "Jelaskan beda REST dan GraphQL untuk tim backend.",
    ],
  },
  noModels: { title: "Belum ada model yang tersedia", body: "Hubungi admin." },
  composer: {
    label: "Pesan",
    placeholder: "Tulis pesan untuk model…",
    hintSend: "kirim",
    hintNewline: "baris baru",
    estimate: (n: number) => `≈ ${n.toLocaleString("en-US")} token (perkiraan)`,
    hold: (amount: string) => `Ditahan maks ${amount}`,
    holdTitle: "Saldo yang ditahan selama request berjalan. Yang ditagih hanya pemakaian asli; sisanya dilepas.",
    send: "Kirim",
    stop: "Stop",
  },
  usage: { input: "masuk", output: "keluar" },
  status: {
    costLater: "Biaya menyusul",
    stopped: "Dihentikan · biaya dicatat di Usage",
    cut: "Terputus",
  },
  thinking: "menyusun jawaban",
  views: { label: "Tampilan area kerja", chat: "Chat", code: "Kode" },
  topUp: "Isi saldo",
  settings: {
    title: "Parameter",
    description: "Berlaku untuk pesan berikutnya.",
    model: "Model",
    system: "System prompt",
    systemPlaceholder: "Contoh: Jawab singkat dalam bahasa Indonesia.",
    temperature: "Temperature",
    temperatureHint: "Rendah untuk jawaban konsisten, tinggi untuk variasi.",
    maxTokens: "Max tokens",
    maxTokensHint: (max: string) => `Batas panjang jawaban, maksimal ${max} untuk model ini. Biaya keluar dihitung dari token yang dipakai.`,
    input: "Input",
    output: "Output",
    codeHint: "Request untuk percakapan dan parameter saat ini. Simpan key di NBYTES_API_KEY.",
  },
};

/** Message above the composer for a failed send; unauthorized never shows, it sends the user to the login page. */
export function playgroundErrorText(error: PlaygroundError): string {
  switch (error.kind) {
    case "insufficient_balance": return "Saldo tidak cukup untuk request ini.";
    case "rate_limited": return `Terlalu banyak request. Coba lagi dalam ${error.retryAfterSeconds} detik.`;
    case "model_not_found": return "Model ini tidak tersedia lagi. Pilih model lain.";
    case "invalid_request": return "Request tidak valid. Bersihkan percakapan lalu coba lagi.";
    case "offline": return "Anda sedang offline. Periksa koneksi lalu coba lagi.";
    default: return "Model belum bisa menjawab. Coba lagi.";
  }
}
