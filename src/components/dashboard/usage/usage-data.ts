// Mock daily costs for the Usage page. Money is integer micro-dollars, dates are UTC.

export type DailyCost = { date: string; costMicros: number; requests: number };

// 30 days ending 2026-11-08, a weekday rhythm with slow growth; deterministic so server and client render the same.
export const dailyCosts: DailyCost[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 9, 10 + i));
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
  const base = 3_200_000 + i * 120_000 + ((i * 7919) % 5) * 260_000;
  const costMicros = weekend ? Math.round(base * 0.45) : base;
  return { date: date.toISOString().slice(0, 10), costMicros, requests: Math.round(costMicros / 150) };
});
