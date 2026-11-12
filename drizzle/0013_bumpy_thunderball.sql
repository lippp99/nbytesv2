CREATE TABLE "contact_channels" (
	"channel" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"visible" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_channels_channel_check" CHECK ("contact_channels"."channel" in ('whatsapp', 'telegram', 'email')),
	CONSTRAINT "contact_channels_visible_check" CHECK (not "contact_channels"."visible" or "contact_channels"."value" <> '')
);
--> statement-breakpoint
ALTER TABLE "contact_channels" ADD CONSTRAINT "contact_channels_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;