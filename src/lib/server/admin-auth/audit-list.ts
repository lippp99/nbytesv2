import "server-only";
import { type SQL, and, count, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  type AuditEntry, type AuditFilter, type AuditPage, type AuditTarget, AUDIT_PAGE_SIZE, LOGIN_AUDIT_TYPES,
} from "@/lib/admin-auth/audit-contract";
import { db } from "../db/client";
import { adminAuditEvents, admins, depositRules, exchangeRates, users } from "../db/schema";

// Read-only list for the admin Audit log page (PRD admin-users-audit §4). Callers check the admin session.

const USER_TYPES = ["user_suspended", "user_restored"];
const MODEL_TYPES = ["model_price_set", "model_disabled"];
const targetAdmin = alias(admins, "target_admin");

function whereOf(filter: AuditFilter): SQL | undefined {
  if (filter === "login") return inArray(adminAuditEvents.type, [...LOGIN_AUDIT_TYPES]);
  if (filter === "actions") return notInArray(adminAuditEvents.type, [...LOGIN_AUDIT_TYPES]);
  return undefined;
}

type Row = {
  type: string; target: string | null; userEmail: string | null; idrPerUsd: number | null; targetAdminEmail: string | null;
  minIdr: number | null; maxIdr: number | null; feeBp: number | null;
};

function targetOf(r: Row): AuditTarget {
  if (r.type === "contact_set") return { kind: "page", page: "contact" };
  if (r.type === "settings_set") return { kind: "page", page: "settings" };
  if (!r.target) return null;
  if (r.type === "deposit_rules_set") return { kind: "depositRules", minIdr: r.minIdr, maxIdr: r.maxIdr, feeBp: r.feeBp };
  if (USER_TYPES.includes(r.type)) return { kind: "user", id: r.target, email: r.userEmail };
  if (MODEL_TYPES.includes(r.type)) return { kind: "model", id: r.target };
  if (r.type === "exchange_rate_set") return { kind: "rate", idrPerUsd: r.idrPerUsd };
  if (r.type === "invited") return { kind: "admin", email: r.targetAdminEmail };
  return null;
}

/** Newest first; the page is clamped to the last one. Targets are joined by text id, so a removed row shows as null. */
export async function listAuditEvents(filter: AuditFilter, requestedPage: number): Promise<AuditPage> {
  const where = whereOf(filter);
  const [{ total }] = await db.select({ total: count() }).from(adminAuditEvents).where(where);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const rows = await db
    .select({
      id: adminAuditEvents.id, createdAt: adminAuditEvents.createdAt, type: adminAuditEvents.type,
      target: adminAuditEvents.target, reason: adminAuditEvents.reason, ipMasked: adminAuditEvents.ipMasked,
      adminEmail: admins.email, userEmail: users.email, idrPerUsd: exchangeRates.idrPerUsd, targetAdminEmail: targetAdmin.email,
      minIdr: depositRules.minIdr, maxIdr: depositRules.maxIdr, feeBp: depositRules.feeBp,
    })
    .from(adminAuditEvents)
    .leftJoin(admins, eq(admins.id, adminAuditEvents.adminId))
    .leftJoin(users, and(sql`${users.id}::text = ${adminAuditEvents.target}`, inArray(adminAuditEvents.type, USER_TYPES)))
    .leftJoin(exchangeRates, and(sql`${exchangeRates.id}::text = ${adminAuditEvents.target}`, eq(adminAuditEvents.type, "exchange_rate_set")))
    .leftJoin(depositRules, and(sql`${depositRules.id}::text = ${adminAuditEvents.target}`, eq(adminAuditEvents.type, "deposit_rules_set")))
    .leftJoin(targetAdmin, and(sql`${targetAdmin.id}::text = ${adminAuditEvents.target}`, eq(adminAuditEvents.type, "invited")))
    .where(where)
    .orderBy(desc(adminAuditEvents.createdAt))
    .limit(AUDIT_PAGE_SIZE)
    .offset((page - 1) * AUDIT_PAGE_SIZE);
  const entries: AuditEntry[] = rows.map((r) => ({
    id: r.id, at: r.createdAt.toISOString(), adminEmail: r.adminEmail, type: r.type, target: targetOf(r),
    reason: r.reason, ipMasked: r.ipMasked,
  }));
  return { entries, page, pages, total };
}
