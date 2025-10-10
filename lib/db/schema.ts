import {
  pgTable,
  varchar,
  text,
  timestamp,
  json,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { InferSelectModel, relations } from 'drizzle-orm';
import { AppUsage } from '../usage';
import { CareerPathSuggestion, DecisionRow, Metadata } from '../types';

export const users = pgTable('users', {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const teams = pgTable('teams', {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export const teamMembers = pgTable('team_members', {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid('user_id')
  .notNull()
  .references(() => users.id),
  teamId: uuid('team_id')
  .notNull()
  .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export const activityLogs = pgTable('activity_logs', {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export const invitations = pgTable('invitations', {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  teamId: uuid('team_id')
  .notNull()
  .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: uuid('invited_by')
  .notNull()
  .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

// export const document = pgTable(
//   "Document",
//   {
//     id: uuid("id").notNull().defaultRandom(),
//     createdAt: timestamp("createdAt").notNull(),
//     title: text("title").notNull(),
//     content: text("content"),
//     kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
//       .notNull()
//       .default("text"),
//     userId: uuid("userId")
//       .notNull()
//       .references(() => user.id),
//   },
//   (table) => {
//     return {
//       pk: primaryKey({ columns: [table.id, table.createdAt] }),
//     };
//   }
// );

// export type Document = InferSelectModel<typeof document>;

export const reports = pgTable('reports', {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  // teamId: uuid('team_id')
  //   .notNull()
  //   .references(() => teams.id),
  metadata: json('metadata').notNull(), // Metadata type
  decisionMatrix: json('decision_matrix').notNull(), // DecisionRow[] type
  suggestions: json('suggestions').notNull(), // Suggestion[] type
  globalRationale: text('global_rationale').notNull(),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  // team: one(teams, {
  //   fields: [reports.teamId],
  //   references: [teams.id],
  // }),
}));

export type Report = typeof reports.$inferSelect & {
  metadata: Metadata;
  decisionMatrix: DecisionRow[];
  suggestions: CareerPathSuggestion[];
  globalRationale: string;
};
export type NewReport = typeof reports.$inferInsert;

export const waitlist = pgTable('waitlist', {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WaitlistRow = typeof waitlist.$inferSelect
export type NewWaitlistRow = typeof waitlist.$inferInsert

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// export const suggestion = pgTable(
//   "Suggestion",
//   {
//     id: uuid("id").notNull().defaultRandom(),
//     documentId: uuid("documentId").notNull(),
//     documentCreatedAt: timestamp("documentCreatedAt").notNull(),
//     originalText: text("originalText").notNull(),
//     suggestedText: text("suggestedText").notNull(),
//     description: text("description"),
//     isResolved: boolean("isResolved").notNull().default(false),
//     userId: uuid("userId")
//       .notNull()
//       .references(() => users.id),
//     createdAt: timestamp("createdAt").notNull(),
//   },
//   // (table) => ({
//   //   pk: primaryKey({ columns: [table.id] }),
//   //   documentRef: foreignKey({
//   //     columns: [table.documentId, table.documentCreatedAt],
//   //     foreignColumns: [document.id, document.createdAt],
//   //   }),
//   // })
// );

// export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  // (table) => ({
  //   pk: primaryKey({ columns: [table.id] }),
  //   chatRef: foreignKey({
  //     columns: [table.chatId],
  //     foreignColumns: [chat.id],
  //   }),
  // })
);

export type Stream = InferSelectModel<typeof stream>;