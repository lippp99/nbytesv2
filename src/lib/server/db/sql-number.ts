import "server-only";
import { type SQL, sql } from "drizzle-orm";

// pg returns sum(bigint) as numeric text; every total read with this stays far below 2^53, so Number is exact.
/** An aggregate as a number, 0 when there are no rows. */
export const sqlNumber = (expr: SQL) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);
