ALTER TABLE "banners" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "banners_campaign_id_idx" ON "banners" USING btree ("campaign_id");