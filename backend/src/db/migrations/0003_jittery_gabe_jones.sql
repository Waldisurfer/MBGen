CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"html" text NOT NULL,
	"desc" text NOT NULL,
	"prompt_used" text NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"parent_banner_id" uuid,
	"round_label" text,
	"ctr" numeric(8, 4),
	"rating" smallint,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "liked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "rating" smallint;--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "round_label" text;--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "ctr" numeric(8, 4);--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "parent_generation_id" uuid;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_parent_banner_id_banners_id_fk" FOREIGN KEY ("parent_banner_id") REFERENCES "public"."banners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "banners_user_id_idx" ON "banners" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "banners_liked_idx" ON "banners" USING btree ("liked");--> statement-breakpoint
CREATE INDEX "banners_deleted_at_idx" ON "banners" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "banners_parent_banner_idx" ON "banners" USING btree ("parent_banner_id");--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_parent_generation_id_generations_id_fk" FOREIGN KEY ("parent_generation_id") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generations_liked_idx" ON "generations" USING btree ("liked");--> statement-breakpoint
CREATE INDEX "generations_parent_generation_id_idx" ON "generations" USING btree ("parent_generation_id");