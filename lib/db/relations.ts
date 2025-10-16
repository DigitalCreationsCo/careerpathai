import { relations } from "drizzle-orm/relations";
import { users, chats, messages, teams, activityLogs, invitations, reports, researchSessions, teamMembers } from "./schema";

export const chatsRelations = relations(chats, ({one, many}) => ({
	user: one(users, {
		fields: [chats.userId],
		references: [users.id]
	}),
	messages: many(messages),
	researchSessions: many(researchSessions),
}));

export const usersRelations = relations(users, ({many}) => ({
	chats: many(chats),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	reports: many(reports),
	researchSessions: many(researchSessions),
	teamMembers: many(teamMembers),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	chat: one(chats, {
		fields: [messages.chatId],
		references: [chats.id]
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	team: one(teams, {
		fields: [activityLogs.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	teamMembers: many(teamMembers),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	user: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id]
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.userId],
		references: [users.id]
	}),
}));

export const researchSessionsRelations = relations(researchSessions, ({one}) => ({
	chat: one(chats, {
		fields: [researchSessions.chatId],
		references: [chats.id]
	}),
	user: one(users, {
		fields: [researchSessions.userId],
		references: [users.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
}));