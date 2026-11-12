import { MAX_JSON_BODY_BYTES, ROUTING_FIELDS } from "@/lib/gateway/chat-contract";
import { KEY_RATE_LIMIT } from "@/lib/gateway/keys/api-key-contract";
import { buildErrorTexts } from "./docs-errors";

const rate = `${KEY_RATE_LIMIT.count} request per ${KEY_RATE_LIMIT.windowSeconds} detik`;
const maxBodyMb = MAX_JSON_BODY_BYTES / 1024 / 1024;

// Text of the API Docs page.
export const docs = {
  title: "API Docs",
  lead: "Referensi API nbytes. Formatnya mengikuti OpenAI, jadi SDK OpenAI untuk Python, Node, dan bahasa lain bisa langsung dipakai dengan base URL nbytes.",
  facts: ["Versi v1", "Format OpenAI", "JSON lewat HTTPS"],
  status: "Endpoint yang tersedia: chat completions dan models. Endpoint lain menyusul.",
  toc: "Di halaman ini",
  connection: { label: "Koneksi", baseUrl: "Base URL" },
  overview: {
    label: "Ringkasan endpoint",
    endpoint: "Endpoint",
    use: "Kegunaan",
    items: [
      { method: "POST", path: "/chat/completions", href: "#chat", use: "Kirim percakapan dan terima jawaban model." },
      { method: "GET", path: "/models", href: "#models", use: "Model yang bisa dipanggil dengan key Anda, dengan harga jual nbytes." },
      { method: "GET", path: "/models/{id}", href: "#models", use: "Satu model, atau 404 untuk id di luar katalog aktif." },
    ],
  },
  request: "Request",
  response: "Contoh respons",
  params: "Parameter body",
  fields: "Field respons",
  required: "wajib",
  optional: "opsional",
  sections: {
    auth: {
      title: "Base URL dan autentikasi",
      body: [
        "Semua request dikirim ke base URL di samping."
          + " Setiap request wajib membawa API key di header Authorization (Bearer) atau x-api-key. Key nbytes selalu berawalan nbk_.",
        "Simpan key di variabel lingkungan server, misalnya NBYTES_API_KEY. Jangan menaruh key di kode frontend atau aplikasi mobile.",
        "Setiap respons membawa header x-request-id. Sertakan id itu bila melaporkan masalah.",
      ],
      header: "Header",
      altHeader: "Header alternatif",
    },
    chat: {
      title: "Membuat chat completion",
      body: [
        "Kirim percakapan dan terima jawaban model. Riwayat pesan dikirim lengkap di setiap request; API tidak menyimpan percakapan.",
        `Body maksimal ${maxBodyMb} MB. Gambar hanya untuk model yang mendukung input gambar; ke model lain ditolak 400 sebelum ada biaya.`,
      ],
      routing: `Field routing berikut dibuang sebelum request diteruskan: ${ROUTING_FIELDS.join(", ")}.`,
    },
    streaming: {
      title: "Streaming",
      body: [
        "Dengan stream: true, jawaban dikirim bertahap sebagai server-sent events. Setiap baris data berisi potongan jawaban di choices[0].delta.content.",
        "Event terakhir sebelum data: [DONE] berisi usage (prompt_tokens, completion_tokens). Angka ini yang dipakai untuk menghitung biaya.",
      ],
    },
    models: {
      title: "Daftar model",
      body: [
        "Model yang bisa dipanggil dengan key Anda, dengan harga jual nbytes. Pakai nilai id sebagai field model saat membuat chat completion.",
        "GET /models/{id} mengembalikan satu model, atau 404 untuk id di luar katalog aktif.",
      ],
    },
    errors: {
      title: "Kode error",
      body: "Error dikirim dengan status HTTP yang sesuai dan body JSON berisi type, code, message (bahasa Inggris) dan param. Baca field code, bukan message.",
      cols: { status: "Status", code: "Kode", meaning: "Arti", action: "Yang dilakukan" },
    },
    limits: {
      title: "Batas dan penagihan",
      body: [
        `Setiap key dibatasi ${rate}. Lewat dari itu dijawab 429 dengan header Retry-After (detik).`,
        "Sebelum request diteruskan, saldo ditahan sebesar perkiraan biaya maksimum. Setelah selesai, yang ditagih hanya pemakaian asli dan sisanya dilepas.",
        "Request yang ditolak atau gagal sebelum jawaban mulai dikirim tidak ditagih."
          + " Stream yang terputus di tengah jalan ditagih sesuai usage yang sudah tercatat, atau sebesar tahanan bila usage belum ada.",
        "Batas bulanan per key (opsional, di API Keys) dihitung sejak tanggal 1 pukul 00.00 UTC. Bila tercapai, request dengan key itu ditolak 402.",
      ],
    },
  },
};

/** Meaning and next step per public error code, with the limits filled in from the contracts. */
export const errorTexts = buildErrorTexts(rate, maxBodyMb);
