CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(100),
	"location" varchar(100),
	"bio" text,
	"intent" varchar(20),
	"is_verified" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"is_banned" boolean DEFAULT false,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now(),
	"avatar_url" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"scope" varchar(10) NOT NULL,
	"location" varchar(100),
	"contact_email" varchar(255),
	"website" varchar(255),
	"values_statement" text,
	"status" varchar(20) DEFAULT 'pending',
	"created_by" integer,
	"is_removed" boolean DEFAULT false,
	"report_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"avatar_url" text,
	CONSTRAINT "orgs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" varchar(10) NOT NULL,
	"scope" varchar(10) NOT NULL,
	"category" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"location" varchar(100),
	"is_active" boolean DEFAULT true,
	"is_removed" boolean DEFAULT false,
	"report_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7)
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_a" integer,
	"participant_b" integer,
	"post_id" integer,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer,
	"sender_id" integer,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer,
	"confirmed_by" integer,
	"confirmed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "thank_you_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer,
	"author_id" integer,
	"recipient_id" integer,
	"body" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"is_displayed" boolean DEFAULT false,
	"is_removed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vouches" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer,
	"voucher_id" integer,
	"vouchee_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vouches_thread_id_voucher_id_key" UNIQUE("thread_id","voucher_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_date" varchar(100),
	"event_time" varchar(100),
	"location" varchar(255),
	"is_recurring" boolean DEFAULT false,
	"capacity" integer,
	"rsvp_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"is_removed" boolean DEFAULT false,
	"type" varchar(50) DEFAULT 'event'
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "event_rsvps_event_id_user_id_key" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"user_id" integer,
	"role" varchar(20) DEFAULT 'member',
	"status" varchar(20) DEFAULT 'pending',
	"joined_at" timestamp DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"author_id" integer,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_removed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "org_creation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitted_by" integer,
	"name" varchar(255) NOT NULL,
	"type" varchar(100),
	"scope" varchar(10),
	"description" text,
	"website" varchar(255),
	"contact_email" varchar(255),
	"values_statement" text,
	"status" varchar(20) DEFAULT 'pending',
	"admin_note" text,
	"created_at" timestamp DEFAULT now(),
	"reviewed_by" integer,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "email_verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer,
	"content_type" varchar(50) NOT NULL,
	"content_id" integer NOT NULL,
	"reason" varchar(100) NOT NULL,
	"other_text" text,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"resolved_by" integer,
	"resolved_at" timestamp,
	"resolution_note" text
);
--> statement-breakpoint
ALTER TABLE "orgs" ADD CONSTRAINT "orgs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_participant_a_users_id_fk" FOREIGN KEY ("participant_a") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_participant_b_users_id_fk" FOREIGN KEY ("participant_b") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completions" ADD CONSTRAINT "completions_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thank_you_notes" ADD CONSTRAINT "thank_you_notes_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thank_you_notes" ADD CONSTRAINT "thank_you_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thank_you_notes" ADD CONSTRAINT "thank_you_notes_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_voucher_id_users_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_vouchee_id_users_id_fk" FOREIGN KEY ("vouchee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_announcements" ADD CONSTRAINT "org_announcements_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_announcements" ADD CONSTRAINT "org_announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_creation_requests" ADD CONSTRAINT "org_creation_requests_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_creation_requests" ADD CONSTRAINT "org_creation_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;