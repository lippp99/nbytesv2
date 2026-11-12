CREATE TABLE "platform_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"signup_open" boolean NOT NULL,
	"maintenance" boolean NOT NULL,
	"banner" text DEFAULT '' NOT NULL,
	"key_rpm" integer NOT NULL,
	"admin_session_hours" smallint NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_single_row_check" CHECK ("platform_settings"."id" = 1),
	CONSTRAINT "platform_settings_values_check" CHECK ("platform_settings"."key_rpm" between 1 and 10000 and "platform_settings"."admin_session_hours" in (4, 8, 12)),
	CONSTRAINT "platform_settings_banner_check" CHECK (not "platform_settings"."maintenance" or "platform_settings"."banner" <> '')
);
--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;