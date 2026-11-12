CREATE TABLE "balance_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"kind" text NOT NULL,
	"amount_micros" bigint NOT NULL,
	"deposit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "balance_ledger_kind_check" CHECK ("balance_ledger"."kind" in ('deposit', 'hold', 'hold_release', 'usage', 'adjustment', 'refund'))
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"amount_idr" bigint NOT NULL,
	"fee_idr" bigint NOT NULL,
	"idr_per_usd" integer NOT NULL,
	"credit_micros" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sumopod_payment_id" text,
	"payment_link_url" text,
	"payment_code" text,
	"payment_code_type" text,
	"payment_channel_used" text,
	"provider_fee_idr" bigint,
	"net_amount_idr" bigint,
	"payment_method" text,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deposits_status_check" CHECK ("deposits"."status" in ('pending', 'paid', 'failed', 'expired')),
	CONSTRAINT "deposits_amounts_check" CHECK ("deposits"."amount_idr" > 0 and "deposits"."fee_idr" >= 0 and "deposits"."credit_micros" >= 0)
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idr_per_usd" integer NOT NULL,
	"set_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_rates_positive_check" CHECK ("exchange_rates"."idr_per_usd" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"svix_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payment_id" text,
	"result" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_balances" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"balance_micros" bigint DEFAULT 0 NOT NULL,
	"held_micros" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balance_ledger" ADD CONSTRAINT "balance_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_ledger" ADD CONSTRAINT "balance_ledger_deposit_id_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_set_by_admins_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "balance_ledger_user_id_idx" ON "balance_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "balance_ledger_deposit_credit_idx" ON "balance_ledger" USING btree ("deposit_id") WHERE "balance_ledger"."kind" = 'deposit';--> statement-breakpoint
CREATE INDEX "deposits_user_id_idx" ON "deposits" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deposits_sumopod_payment_id_idx" ON "deposits" USING btree ("sumopod_payment_id");--> statement-breakpoint
CREATE INDEX "exchange_rates_created_at_idx" ON "exchange_rates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "exchange_rates_set_by_idx" ON "exchange_rates" USING btree ("set_by");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_webhook_events_svix_id_idx" ON "payment_webhook_events" USING btree ("svix_id");