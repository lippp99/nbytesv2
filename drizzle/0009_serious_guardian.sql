ALTER TABLE "admin_audit_events" ADD COLUMN "ip_masked" text;--> statement-breakpoint
ALTER TABLE "admin_audit_events" ADD COLUMN "reason" text;--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");