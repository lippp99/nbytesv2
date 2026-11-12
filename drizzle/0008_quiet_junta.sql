CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"monthly_budget_micros" bigint,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_budget_check" CHECK ("api_keys"."monthly_budget_micros" is null or "api_keys"."monthly_budget_micros" > 0)
);
--> statement-breakpoint
CREATE TABLE "gateway_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"api_key_id" uuid,
	"model_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"stream" boolean NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"hold_micros" bigint NOT NULL,
	"charge_micros" bigint,
	"input_tokens" integer,
	"output_tokens" integer,
	"surplus_request_id" text,
	"surplus_cost_micros" bigint,
	"cost_status" text,
	"status_code" integer,
	"error_code" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gateway_requests_state_check" CHECK ("gateway_requests"."state" in ('pending', 'succeeded', 'failed')),
	CONSTRAINT "gateway_requests_cost_status_check" CHECK ("gateway_requests"."cost_status" is null or "gateway_requests"."cost_status" in ('known', 'pending')),
	CONSTRAINT "gateway_requests_money_check" CHECK ("gateway_requests"."hold_micros" >= 0 and ("gateway_requests"."charge_micros" is null or "gateway_requests"."charge_micros" >= 0))
);
--> statement-breakpoint
CREATE TABLE "model_prices" (
	"model_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"context_length" integer,
	"max_completion_tokens" integer,
	"supports_images" boolean NOT NULL,
	"list_input_micros" bigint NOT NULL,
	"list_output_micros" bigint NOT NULL,
	"markup_bp" integer DEFAULT 0 NOT NULL,
	"input_micros" bigint NOT NULL,
	"output_micros" bigint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_prices_markup_check" CHECK ("model_prices"."markup_bp" > -10000 and "model_prices"."markup_bp" <= 30000),
	CONSTRAINT "model_prices_prices_check" CHECK ("model_prices"."input_micros" >= 0 and "model_prices"."output_micros" >= 0)
);
--> statement-breakpoint
ALTER TABLE "balance_ledger" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_requests" ADD CONSTRAINT "gateway_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_requests" ADD CONSTRAINT "gateway_requests_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gateway_requests_user_id_idx" ON "gateway_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gateway_requests_api_key_created_idx" ON "gateway_requests" USING btree ("api_key_id","created_at");--> statement-breakpoint
CREATE INDEX "gateway_requests_created_at_idx" ON "gateway_requests" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "balance_ledger" ADD CONSTRAINT "balance_ledger_request_id_gateway_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."gateway_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "balance_ledger_request_id_idx" ON "balance_ledger" USING btree ("request_id");