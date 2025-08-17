import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  bigint,
} from 'drizzle-orm/pg-core';

// ENUMS for Supabase template
export const pricingTypeEnum = pgEnum('pricing_type', ['one_time', 'recurring']);
export const pricingPlanIntervalEnum = pgEnum('pricing_plan_interval', ['day', 'week', 'month', 'year']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid']);

// CUSTOM TABLES (workspaces, folders, files)

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  workspaceOwner: uuid('workspace_owner').notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id').notNull(),
  data: text('data'),
  inTrash: text('in_trash'),
  logo: text('logo'),
  bannerUrl: text('banner_url'),
});

export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id').notNull(),
  data: text('data'),
  inTrash: text('in_trash'),
  bannerUrl: text('banner_url'),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
});

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id').notNull(),
  data: text('data'),
  inTrash: text('in_trash'),
  bannerUrl: text('banner_url'),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id')
    .notNull()
    .references(() => folders.id, { onDelete: 'cascade' }),
});

// TABLES FROM SUPABASE STRIPE TEMPLATE

export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  billingAddress: jsonb('billing_address'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  paymentMethod: jsonb('payment_method'),
  email: text('email'),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().notNull(),
  stripeCustomerId: text('stripe_customer_id'),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().notNull(),
  active: boolean('active'),
  name: text('name'),
  description: text('description'),
  image: text('image'),
  metadata: jsonb('metadata'),
});

export const prices = pgTable('prices', {
  id: text('id').primaryKey().notNull(),
  productId: text('product_id').references(() => products.id),
  active: boolean('active'),
  description: text('description'),
  unitAmount: bigint('unit_amount', { mode: 'number' }),
  currency: text('currency'),
  type: pricingTypeEnum('type'),
  interval: pricingPlanIntervalEnum('interval'),
  intervalCount: integer('interval_count'),
  trialPeriodDays: integer('trial_period_days'),
  metadata: jsonb('metadata'),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  status: subscriptionStatusEnum('status'),
  metadata: jsonb('metadata'),
  priceId: text('price_id').references(() => prices.id),
  quantity: integer('quantity'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  created: timestamp('created', { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true, mode: 'string' }).default(sql`now()`),
  cancelAt: timestamp('cancel_at', { withTimezone: true, mode: 'string' }).default(sql`now()`),
  canceledAt: timestamp('canceled_at', { withTimezone: true, mode: 'string' }).default(sql`now()`),
  trialStart: timestamp('trial_start', { withTimezone: true, mode: 'string' }).default(sql`now()`),
  trialEnd: timestamp('trial_end', { withTimezone: true, mode: 'string' }).default(sql`now()`),
});

export const collaborators = pgTable('collaborators', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string', })
    .defaultNow()
    .notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  folders: many(folders),
  collaborators: many(collaborators),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [folders.workspaceId],
    references: [workspaces.id],
  }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
  workspace: one(workspaces, {
    fields: [files.workspaceId],
    references: [workspaces.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  users: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const collaboratorsRelations = relations(collaborators, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [collaborators.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [collaborators.userId],
    references: [users.id],
  }),
}));
