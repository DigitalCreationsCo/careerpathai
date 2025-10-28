import { z } from "zod";
import { BaseMessage } from "@langchain/core/messages";

// Zod schema for ConductResearch event state
export const ConductResearch = z.object({
  researchTopic: z.string(),
});

// Zod schema for ResearchComplete event state (empty schema)
export const ResearchComplete = z.object({});

// Zod schema for Summary event state
export const Summary = z.object({
  summary: z.string(),
  keyExcerpts: z.string(),
});

// Zod schema for clarifying with user
export const ClarifyWithUser = z.object({
  needClarification: z.boolean(),
  question: z.string().optional(),
  verification: z.string().optional(),
});

// Zod schema for ResearchQuestion event state
export const ResearchQuestion = z.object({
  researchBrief: z.string(),
});

// Zod schema for MessageLike (arbitrary object)
export const MessageLike = z.record(z.any());

export type ConductResearch = typeof ConductResearch._type;
export type ResearchComplete = typeof ResearchComplete._type;
export type Summary = typeof Summary._type;
export type ClarifyWithUser = typeof ClarifyWithUser._type;
export type ResearchQuestion = typeof ResearchQuestion._type;
export type MessageLike = typeof MessageLike._type;

// Zod schema for MessagesState
export const MessagesState = z.object({
  messages: z.array(MessageLike).optional(),
});

export type MessagesState = typeof MessagesState._type;

// Zod schema for AgentInputState
export const AgentInputState = z.object({
  messages: z.array(MessageLike).optional(),
});

export type AgentInputState = typeof AgentInputState._type;

// Zod schema for ResearcherState
export const ResearcherState = z.object({
  researcherMessages: z.array(MessageLike),
  toolCallIterations: z.number(),
  researchTopic: z.string(),
  compressedResearch: z.string(),
  rawNotes: z.array(z.string()),
});

export type ResearcherState = typeof ResearcherState._type;

// Zod schema for ResearcherOutputState
export const ResearcherOutputState = z.object({
  compressedResearch: z.string(),
  rawNotes: z.array(z.string()),
});

export type ResearcherOutputState = typeof ResearcherOutputState._type;

// Zod schema for AgentState (main agent state)
export const AgentState = z.object({
  messages: z.array(z.custom<BaseMessage>()),
  supervisorMessages: z.array(z.custom<BaseMessage>()),
  researchBrief: z.string(),
  researchOutline: z.string(),
  notes: z.array(z.string()),
  finalReport: z.string(),
});

export type AgentState = typeof AgentState._type;

// Zod schema for SupervisorState
export const SupervisorState = z.object({
  messages: z.array(MessageLike),
  supervisorMessages: z.array(z.custom<BaseMessage>()),
  notes: z.array(z.string()),
  researchBrief: z.string(),
  researchIterations: z.number(),
});

export type SupervisorState = typeof SupervisorState._type;