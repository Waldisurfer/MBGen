import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const generationTypeEnum = pgEnum('generation_type', ['copy', 'image', 'animation', 'video']);
export const generationStatusEnum = pgEnum('generation_status', ['pending', 'processing', 'completed', 'failed']);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  strategy: text('strategy').notNull(),
  audience: jsonb('audience').notNull(),
  brand: jsonb('brand').notNull(),
  brief: jsonb('brief'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const generations = pgTable('generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id, { onDelete: 'cascade' })
    .notNull(),
  type: generationTypeEnum('type').notNull(),
  platform: text('platform').notNull(),
  content: jsonb('content').notNull(),
  promptUsed: text('prompt_used').notNull(),
  status: generationStatusEnum('status').default('pending').notNull(),
  externalJobId: text('external_job_id'),
  model: text('model'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
