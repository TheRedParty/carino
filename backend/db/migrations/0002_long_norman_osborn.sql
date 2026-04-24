ALTER TABLE "orgs" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "orgs" ADD COLUMN "contribution_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "orgs" ADD COLUMN "stripe_session_id" text;--> statement-breakpoint
ALTER TABLE "orgs" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "orgs" ADD COLUMN "paid_at" timestamp;