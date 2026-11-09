import type { AdminRole } from "./team-data";

// Text of the admin team & access page (PRD admin-console §1, §2.2).
export const teamCopy = {
  title: "Admin & akses",
  sub: "Siapa yang bisa masuk ke konsol ini, perannya, dan status authenticator (TOTP).",
  invite: "Undang admin",
  inviteLater: "Undangan menyusul bersama API admin.",
  admins: "Admin",
  cols: { admin: "Admin", role: "Peran", totp: "TOTP", lastLogin: "Login terakhir (UTC)" },
  totpOn: "Aktif",
  totpPending: "Belum diatur",
  never: "Belum pernah",
  roles: "Peran",
  rolesSub: "Batas akses per peran. Ditegakkan di server pada fase backend.",
};

export const roleScopes: { role: AdminRole; scope: string }[] = [
  { role: "Owner", scope: "Semua menu, termasuk mengundang atau mencabut admin dan mengubah pengaturan platform." },
  { role: "Admin", scope: "Kelola pengguna, model, harga dan provider; lihat keuangan dan audit log." },
  { role: "Support", scope: "Hanya melihat pengguna, request log dan keuangan. Tidak bisa mengubah apa pun." },
];
