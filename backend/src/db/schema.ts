import { pgTable, uuid, text, jsonb, timestamp, pgEnum, numeric, index } from 'drizzle-orm/pg-core';

export const generationTypeEnum = pgEnum('generation_type', ['copy', 'image', 'animation', 'video']);
export const generationStatusEnum = pgEnum('generation_status', ['pending', 'processing', 'completed', 'failed']);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  strategy: text('strategy').notNull(),
  audience: jsonb('audience').notNull(),
  brand: jsonb('brand').notNull(),
  brief: jsonb('brief'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('campaigns_user_id_idx').on(t.userId),
]);

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
  userId: text('user_id').notNull(),
  estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 6 }),
  actualCostUsd: numeric('actual_cost_usd', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('generations_user_id_idx').on(t.userId),
  index('generations_campaign_id_idx').on(t.campaignId),
  index('generations_external_job_id_idx').on(t.externalJobId),
  index('generations_created_at_idx').on(t.createdAt),
]);

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  role: text('role').notNull().default('user'),
  // 'active' = approved, 'pending' = awaiting approval, 'suspended' = blocked
  // DB default is 'active' so existing rows stay active; new users are set explicitly in middleware
  status: text('status').notNull().default('active'),
  monthlySpendUsd: numeric('monthly_spend_usd', { precision: 10, scale: 6 }).notNull().default('0'),
  monthlyResetAt: timestamp('monthly_reset_at').defaultNow().notNull(),
  styleGuidelines: jsonb('style_guidelines'),
  styleFileUrl: text('style_file_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
