import { pgTable, uuid, text, jsonb, timestamp, pgEnum, numeric, index, boolean, smallint, AnyPgColumn } from 'drizzle-orm/pg-core';

export const generationTypeEnum = pgEnum('generation_type', ['copy', 'image', 'animation', 'video']);
export const generationStatusEnum = pgEnum('generation_status', ['pending', 'processing', 'completed', 'failed']);

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  tone: text('tone').notNull(),
  colors: text('colors').array().notNull(),
  fonts: text('fonts').array().notNull(),
  logoKey: text('logo_key'),
  private: boolean('private').default(false).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('brands_user_id_idx').on(t.userId),
]);

export const audiences = pgTable('audiences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  demographics: text('demographics').notNull(),
  psychographics: text('psychographics').notNull(),
  painPoints: text('pain_points').notNull(),
  channels: text('channels').array().notNull(),
  private: boolean('private').default(false).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('audiences_user_id_idx').on(t.userId),
]);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  strategy: text('strategy').notNull(),
  audience: jsonb('audience').notNull(),
  brand: jsonb('brand').notNull(),
  brief: jsonb('brief'),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  audienceId: uuid('audience_id').references(() => audiences.id, { onDelete: 'set null' }),
  private: boolean('private').default(false).notNull(),
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
  liked: boolean('liked').default(false),
  rating: smallint('rating'),
  notes: text('notes'),
  roundLabel: text('round_label'),
  ctr: numeric('ctr', { precision: 8, scale: 4 }),
  parentGenerationId: uuid('parent_generation_id').references((): AnyPgColumn => generations.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('generations_user_id_idx').on(t.userId),
  index('generations_campaign_id_idx').on(t.campaignId),
  index('generations_external_job_id_idx').on(t.externalJobId),
  index('generations_created_at_idx').on(t.createdAt),
  index('generations_liked_idx').on(t.liked),
  index('generations_parent_generation_id_idx').on(t.parentGenerationId),
]);

export const banners = pgTable('banners', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         text('user_id').notNull(),
  campaignId:     uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  html:           text('html').notNull(),
  desc:           text('desc').notNull(),
  promptUsed:     text('prompt_used').notNull(),
  liked:          boolean('liked').default(false).notNull(),
  deletedAt:      timestamp('deleted_at'),
  parentBannerId: uuid('parent_banner_id').references((): AnyPgColumn => banners.id, { onDelete: 'set null' }),
  roundLabel:     text('round_label'),
  ctr:            numeric('ctr', { precision: 8, scale: 4 }),
  rating:         smallint('rating'),
  notes:          text('notes'),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('banners_user_id_idx').on(t.userId),
  index('banners_campaign_id_idx').on(t.campaignId),
  index('banners_liked_idx').on(t.liked),
  index('banners_deleted_at_idx').on(t.deletedAt),
  index('banners_parent_banner_idx').on(t.parentBannerId),
]);

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  email: text('email'),
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
