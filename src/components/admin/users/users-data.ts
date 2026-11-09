// Mock user accounts for the admin. Every row is an example; money in integer micro-dollars, dates in UTC.
export type UserStatus = "active" | "suspended" | "pending";
export type UserRow = {
  id: string;
  name: string;
  email: string;
  plan: "Gratis" | "Pro" | "Tim";
  balanceMicros: number;
  spentMonthMicros: number;
  status: UserStatus;
  joinedAt: string;
};

export const userRows: UserRow[] = [
  { id: "usr_1", name: "Rina Wulandari", email: "rina@kopikode.example", plan: "Pro", balanceMicros: 42_500_000, spentMonthMicros: 128_600_000, status: "active", joinedAt: "2026-08-14" },
  { id: "usr_2", name: "Lumbung Data", email: "ops@lumbung.example", plan: "Tim", balanceMicros: 1_204_000_000, spentMonthMicros: 2_410_300_000, status: "active", joinedAt: "2026-06-02" },
  { id: "usr_3", name: "Arunika Labs", email: "dev@arunika.example", plan: "Pro", balanceMicros: 3_100_000, spentMonthMicros: 61_200_000, status: "active", joinedAt: "2026-09-21" },
  { id: "usr_4", name: "Budi Santoso", email: "budi@toko.example", plan: "Gratis", balanceMicros: 800_000, spentMonthMicros: 4_200_000, status: "active", joinedAt: "2026-10-30" },
  { id: "usr_5", name: "Sekolahku", email: "ai@sekolahku.example", plan: "Tim", balanceMicros: 310_000_000, spentMonthMicros: 402_900_000, status: "active", joinedAt: "2026-07-11" },
  { id: "usr_6", name: "Spam Bot 42", email: "x91@mailinator.example", plan: "Gratis", balanceMicros: 0, spentMonthMicros: 0, status: "suspended", joinedAt: "2026-11-03" },
  { id: "usr_7", name: "Maya Putri", email: "maya@studio.example", plan: "Gratis", balanceMicros: 0, spentMonthMicros: 0, status: "pending", joinedAt: "2026-11-08" },
];
