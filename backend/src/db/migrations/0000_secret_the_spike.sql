CREATE TYPE "public"."generation_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."generation_type" AS ENUM('copy', 'image', 'animation', 'video');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"strategy" text NOT NULL,
	"audience" jsonb NOT NULL,
	"brand" jsonb NOT NULL,
	"brief" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"type" "generation_type" NOT NULL,
	"platform" text NOT NULL,
	"content" jsonb NOT NULL,
	"prompt_used" text NOT NULL,
	"status" "generation_status" DEFAULT 'pending' NOT NULL,
	"external_job_id" text,
	"model" text,
	"user_id" text NOT NULL,
	"estimated_cost_usd" numeric(10, 6),
	"actual_cost_usd" numeric(10, 6),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"monthly_spend_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"monthly_reset_at" timestamp DEFAULT now() NOT NULL,
	"style_guidelines" jsonb,
	"style_file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_user_id_idx" ON "campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generations_user_id_idx" ON "generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generations_campaign_id_idx" ON "generations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "generations_external_job_id_idx" ON "generations" USING btree ("external_job_id");--> statement-breakpoint
CREATE INDEX "generations_created_at_idx" ON "generations" USING btree ("created_at");