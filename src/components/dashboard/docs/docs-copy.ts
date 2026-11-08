// Text of the API Docs page.
export const docs = {
  title: "API Docs",
  lead: "Referensi API nbytes. Formatnya mengikuti OpenAI, jadi SDK OpenAI untuk Python, Node, dan bahasa lain bisa langsung dipakai dengan base URL nbytes.",
  facts: ["Versi v1", "Format OpenAI", "JSON lewat HTTPS"],
  draft: "Draf. Endpoint, parameter, dan kode error masih bisa berubah sampai backend tersambung.",
  toc: "Di halaman ini",
  request: "Request",
  response: "Respons",
  params: "Parameter body",
  fields: "Field respons",
  required: "wajib",
  optional: "opsional",
  sections: {
    auth: {
      title: "Base URL dan autentikasi",
      body: [
        "Semua request dikirim ke base URL di samping. Setiap request wajib membawa API key di header Authorization.",
        "Simpan key di variabel lingkungan server, misalnya NBYTES_API_KEY. Jangan menaruh key di kode frontend atau aplikasi mobile.",
      ],
      header: "Header",
    },
    chat: {
      title: "Membuat chat completion",
      body: "Kirim percakapan dan terima jawaban model. Riwayat pesan dikirim lengkap di setiap request; API tidak menyimpan percakapan.",
    },
    models: {
      title: "Daftar model",
      body: "Model yang bisa dipanggil dengan key Anda. Pakai nilai id sebagai field model saat membuat chat completion.",
    },
    errors: {
      title: "Kode error",
      body: "Error dikirim dengan status HTTP yang sesuai dan body JSON berisi pesan yang bisa dibaca manusia.",
      cols: { code: "Status", meaning: "Arti", action: "Yang perlu dilakukan" },
    },
  },
};
