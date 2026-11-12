ALTER TABLE "admins" DROP CONSTRAINT "admins_role_check";--> statement-breakpoint
ALTER TABLE "admins" DROP CONSTRAINT "admins_status_check";--> statement-breakpoint
ALTER TABLE "admins" DROP CONSTRAINT "admins_invited_by_admins_id_fk";
--> statement-breakpoint
DROP INDEX "admins_invited_by_idx";--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "invited_by";--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_status_check" CHECK ("admins"."status" in ('invited', 'active'));