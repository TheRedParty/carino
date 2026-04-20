ALTER TABLE "posts" ADD COLUMN "org_id" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "members_only" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "claimed_by" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "fulfilled_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;