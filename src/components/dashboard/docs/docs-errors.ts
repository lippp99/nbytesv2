import type { GatewayErrorCode } from "@/lib/gateway/error-contract";

// Indonesian meaning and next step per public error code (the API's own messages are English). Pure, so the test can
// check that every code of the error contract has its text.

/** Codes only the Playground answers with; the public API never does, so the Docs leave them out. */
export const PLAYGROUND_ONLY_CODES: readonly GatewayErrorCode[] = ["unauthorized", "forbidden"];
export type DocErrorCode = Exclude<GatewayErrorCode, "unauthorized" | "forbidden">;
export type ErrorText = { meaning: string; action: string };

/** `rate`: "120 request per 60 detik"; `maxBodyMb`: the JSON body limit. Both come from the contracts. */
export function buildErrorTexts(rate: string, maxBodyMb: number): Record<DocErrorCode, ErrorText> {
  return {
    invalid_request: {
      meaning: "Body tidak valid: field wajib hilang atau bertipe salah, atau gambar ke model tanpa input gambar.",
      action: "Periksa field yang disebut di param.",
    },
    invalid_api_key: { meaning: "API key tidak ada, salah, atau sudah dicabut.", action: "Periksa header dan status key di API Keys." },
    insufficient_balance: { meaning: "Saldo tidak cukup untuk menahan biaya request ini.", action: "Isi saldo di Billing." },
    key_budget_exceeded: { meaning: "Batas bulanan key ini tercapai.", action: "Pakai key lain, atau tunggu tanggal 1 pukul 00.00 UTC." },
    account_suspended: { meaning: "Akun ditangguhkan.", action: "Hubungi admin nbytes." },
    model_not_found: { meaning: "Model tidak ada di katalog aktif. Alias juga ditolak.", action: "Pakai id persis dari GET /models." },
    request_too_large: { meaning: `Body lebih dari ${maxBodyMb} MB.`, action: "Perkecil percakapan atau lampiran." },
    rate_limited: { meaning: `Lebih dari ${rate} untuk key ini.`, action: "Tunggu sesuai header Retry-After, lalu coba lagi." },
    service_unavailable: { meaning: "Layanan sedang tidak tersedia.", action: "Coba lagi beberapa saat lagi." },
    model_unavailable: { meaning: "Model sedang tidak tersedia.", action: "Coba lagi nanti atau pakai model lain." },
    upstream_error: { meaning: "Penyedia model mengembalikan error.", action: "Coba lagi. Request yang ditolak dengan kode ini tidak ditagih." },
  };
}
