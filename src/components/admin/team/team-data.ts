// Mock admin accounts. Every row is an example; times in UTC.
export type AdminRole = "Owner" | "Admin" | "Support";
export type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  totp: "on" | "pending";
  lastLoginAt: string | null;
};

export const adminRows: AdminRow[] = [
  { id: "adm_1", name: "Dimas Pratama", email: "dimas@nbytes.example", role: "Owner", totp: "on", lastLoginAt: "2026-11-08T08:02:00Z" },
  { id: "adm_2", name: "Sari Lestari", email: "sari@nbytes.example", role: "Admin", totp: "on", lastLoginAt: "2026-11-07T22:10:00Z" },
  { id: "adm_3", name: "Yoga Nugroho", email: "yoga@nbytes.example", role: "Support", totp: "on", lastLoginAt: "2026-11-06T03:44:00Z" },
  { id: "adm_4", name: "Ayu Maharani", email: "ayu@nbytes.example", role: "Support", totp: "pending", lastLoginAt: null },
];
