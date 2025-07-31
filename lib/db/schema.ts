import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  json,
  boolean,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

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

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  // userId: integer('user_id')
  //   .notNull()
  //   .references(() => users.id),
  // teamId: integer('team_id')
  //   .notNull()
  //   .references(() => teams.id),
  metadata: json('metadata').notNull(), // Metadata type
  decisionMatrix: json('decision_matrix').notNull(), // DecisionRow[] type
  suggestions: json('suggestions').notNull(), // Suggestion[] type
  globalRationale: text('global_rationale').notNull(),
});

// export const reportsRelations = relations(reports, ({ one }) => ({
//   user: one(users, {
//     fields: [reports.userId],
//     references: [users.id],
//   }),
//   // team: one(teams, {
//   //   fields: [reports.teamId],
//   //   references: [teams.id],
//   // }),
// }));


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};
export type Report = typeof reports.$inferSelect & {
  id: number;
  metadata: Metadata;
  decisionMatrix: DecisionRow[];
  suggestions: Suggestion[];
  globalRationale: string;
};
export type NewReport = typeof reports.$inferInsert;
// export type ReportWithUser = Report & {
//   user: Pick<User, 'id' | 'name' | 'email'>;
// };

/** =========================
 *  Types (mirroring schema)
 *  ========================= */

type ScoreWeight = {
  market_demand: number;
  de_risking_automation: number;
  transferability: number;
  salary_potential: number;
  time_to_break_in: number;
};

type ScoreBreakdown = {
  final: number;
  automation_risk: number;
  market_demand: number;
  transferability: number;
  salary_potential: number;
  time_to_break_in: number;
  weights: ScoreWeight;
};

type Evidence = {
  claim: string;
  rationale: string;
};

type Resource = {
  type: 'course' | 'book' | 'yt' | 'project' | 'cert' | 'article' | 'doc';
  title: string;
  provider?: string;
  est_hours?: number;
};

type MissingSkill = {
  skill: string;
  why_it_matters: string;
  estimated_learning_hours: number;
  learning_sequence_order: number;
  resources: Resource[];
};

type Salary = {
  currency: string;
  p50?: number;
  p90?: number;
  note?: string;
};

type EntryPath = {
  time_to_break_in_months: number;
  starter_projects: string[];
  certs?: string[];
  proof_of_work_assets: string[];
};

type OutreachTemplates = {
  cold_dm: string;
  linkedin_about: string;
  resume_headline: string;
};

type Suggestion = {
  title: string;
  short_pitch: string;
  why_future_proof: string;
  automation_risk: number;
  market_demand: number;
  salary: Salary;
  transferable_skills: string[];
  missing_skills: MissingSkill[];
  entry_path: EntryPath;
  first_14_days: string[];
  outreach_templates: OutreachTemplates;
  score_breakdown: ScoreBreakdown;
  evidence: Evidence[];
};

type DecisionRow = {
  title: string;
  final_score: number;
  automation_risk: number;
  market_demand: number;
  transferability: number;
  salary_potential: number;
  time_to_break_in: number;
};

type Metadata = {
  titles: string[];
  highlights: string[];
  best_path: string;
  summary: string;
  scores: { title: string; score: number }[];
  candidate_count: number;
  generated_at: string;
  notes?: string;
  user: {
    id: number;
    name: string;
    email: string;
  }
};

type CareerPathResponse = {
  metadata: Metadata;
  decision_matrix: DecisionRow[];
  suggestions: Suggestion[];
  global_rationale: string;
};


export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
