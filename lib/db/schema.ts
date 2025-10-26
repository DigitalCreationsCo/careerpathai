import { pgTable, foreignKey, uuid, timestamp, text, varchar, jsonb, json, unique, integer, primaryKey, boolean } from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "@auth/core/adapters"

export const chats = pgTable("chats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	userId: uuid().notNull(),
	visibility: varchar().default('private').notNull(),
	lastContext: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chats_userId_users_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	parts: json().notNull(),
	attachments: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "messages_chatId_chats_id_fk"
		}),
]);

export const stream = pgTable("stream", {
	id: uuid().defaultRandom().notNull(),
	chatId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
});

export const waitlist = pgTable("waitlist", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("waitlist_email_unique").on(table.email),
]);

export const teams = pgTable("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripeProductId: text("stripe_product_id"),
	planName: varchar("plan_name", { length: 50 }),
	subscriptionStatus: varchar("subscription_status", { length: 20 }),
}, (table) => [
	unique("teams_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("teams_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const activityLogs = pgTable("activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id"),
	action: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "activity_logs_team_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: timestamp("emailVerified", { mode: "date" }),
	image: text("image"),
	passwordHash: text("password_hash"),
	role: varchar({ length: 20 }).default('member').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const invitations = pgTable("invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	invitedBy: uuid("invited_by").notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "invitations_invited_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "invitations_team_id_teams_id_fk"
		}),
]);

export const reports = pgTable("reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	metadata: json().notNull(),
	decisionMatrix: json("decision_matrix").notNull(),
	suggestions: json().notNull(),
	globalRationale: text("global_rationale").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reports_user_id_users_id_fk"
		}),
]);

export const researchSessions = pgTable("research_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull().references(() => users.id),
	chatId: uuid("chat_id"),
	threadId: varchar("thread_id", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('active').notNull(),
	researchBrief: text("research_brief"),
	configuration: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "research_sessions_chat_id_chats_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "research_sessions_user_id_users_id_fk"
		}),
	unique("research_sessions_thread_id_unique").on(table.threadId),
]);

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	teamId: uuid("team_id").notNull(),
	role: varchar({ length: 50 }).notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_members_team_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "team_members_user_id_users_id_fk"
		}),
]);

export const accounts = pgTable(
	"account",
	{
	  userId: uuid("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	  type: text("type").$type<AdapterAccountType>().notNull(),
	  provider: text("provider").notNull(),
	  providerAccountId: text("providerAccountId").notNull(),
	  refresh_token: text("refresh_token"),
	  access_token: text("access_token"),
	  expires_at: integer("expires_at"),
	  token_type: text("token_type"),
	  scope: text("scope"),
	  id_token: text("id_token"),
	  session_state: text("session_state"),
	},
	(account) => [
	  {
		compoundKey: primaryKey({
		  columns: [account.provider, account.providerAccountId],
		}),
	  },
	]
  )
   
  export const sessions = pgTable("session", {
	sessionToken: text("sessionToken").primaryKey(),
	userId: uuid("userId")
	  .notNull()
	  .references(() => users.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { mode: "date" }).notNull(),
  })
   
  export const verificationTokens = pgTable(
	"verificationToken",
	{
	  identifier: text("identifier").notNull(),
	  token: text("token").notNull(),
	  expires: timestamp("expires", { mode: "date" }).notNull(),
	},
	(verificationToken) => [
	  {
		compositePk: primaryKey({
		  columns: [verificationToken.identifier, verificationToken.token],
		}),
	  },
	]
  )
   
  export const authenticators = pgTable(
	"authenticator",
	{
	  credentialID: text("credentialID").notNull().unique(),
	  userId: uuid("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	  providerAccountId: text("providerAccountId").notNull(),
	  credentialPublicKey: text("credentialPublicKey").notNull(),
	  counter: integer("counter").notNull(),
	  credentialDeviceType: text("credentialDeviceType").notNull(),
	  credentialBackedUp: boolean("credentialBackedUp").notNull(),
	  transports: text("transports"),
	},
	(authenticator) => [
	  {
		compositePK: primaryKey({
		  columns: [authenticator.userId, authenticator.credentialID],
		}),
	  },
	]
  )