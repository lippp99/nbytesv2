ALTER TABLE "gateway_requests" ADD COLUMN "upstream_error_code" text;--> statement-breakpoint
ALTER TABLE "gateway_requests" ADD COLUMN "upstream_family" text;--> statement-breakpoint
ALTER TABLE "gateway_requests" ADD COLUMN "truncated" boolean;--> statement-breakpoint
CREATE INDEX "gateway_requests_state_created_idx" ON "gateway_requests" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "gateway_requests_cost_pending_idx" ON "gateway_requests" USING btree ("created_at") WHERE "gateway_requests"."cost_status" = 'pending';