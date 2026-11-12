CREATE TABLE "deposit_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"min_idr" bigint NOT NULL,
	"max_idr" bigint NOT NULL,
	"fee_bp" integer NOT NULL,
	"set_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deposit_rules_values_check" CHECK ("deposit_rules"."min_idr" > 0 and "deposit_rules"."max_idr" >= "deposit_rules"."min_idr" and "deposit_rules"."fee_bp" >= 0)
);
--> statement-breakpoint
ALTER TABLE "deposit_rules" ADD CONSTRAINT "deposit_rules_set_by_admins_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deposit_rules_created_at_idx" ON "deposit_rules" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deposit_rules_set_by_idx" ON "deposit_rules" USING btree ("set_by");