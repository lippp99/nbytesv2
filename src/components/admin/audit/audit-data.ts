// Mock audit trail (append-only in the real system). Every row is an example; times in UTC.
export type AuditRow = { id: string; at: string; actor: string; action: string; target: string; ip: string };

export const auditRows: AuditRow[] = [
  { id: "aud_88", at: "2026-11-08T08:55:12Z", actor: "dimas@nbytes.example", action: "provider.disable", target: "xai", ip: "103.28.12.4" },
  { id: "aud_87", at: "2026-11-08T08:02:40Z", actor: "dimas@nbytes.example", action: "admin.login", target: "-", ip: "103.28.12.4" },
  { id: "aud_86", at: "2026-11-07T22:14:03Z", actor: "sari@nbytes.example", action: "admin.totp_failed", target: "5x", ip: "180.244.9.71" },
  { id: "aud_85", at: "2026-11-07T16:30:55Z", actor: "sari@nbytes.example", action: "user.suspend", target: "usr_6", ip: "180.244.9.71" },
  { id: "aud_84", at: "2026-11-07T11:08:21Z", actor: "sari@nbytes.example", action: "payment.refund", target: "pay_3016", ip: "180.244.9.71" },
  { id: "aud_83", at: "2026-11-06T09:41:00Z", actor: "dimas@nbytes.example", action: "model.price_update", target: "deepseek-v3.2", ip: "103.28.12.4" },
  { id: "aud_82", at: "2026-11-06T03:44:18Z", actor: "yoga@nbytes.example", action: "admin.login", target: "-", ip: "36.72.140.9" },
  { id: "aud_81", at: "2026-11-05T14:12:37Z", actor: "dimas@nbytes.example", action: "admin.invite", target: "ayu@nbytes.example", ip: "103.28.12.4" },
];
