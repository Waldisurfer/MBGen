ALTER TABLE "audiences" ADD COLUMN "private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "email" text;