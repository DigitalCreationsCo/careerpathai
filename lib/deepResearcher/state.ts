import { z } from "zod";

export function overrideReducer<T>(currentValue: T, newValue: any): T {
  if (typeof newValue === "object" && newValue?.type === "override") {
    return newValue.value ?? newValue;
  }
  return Array.isArray(currentValue)
    ? ([...currentValue, ...newValue] as T)
    : ((currentValue as any) + (newValue as any));
}

export const ConductResearch = z.object({
  researchTopic: z
    .string()
    .describe(
      "The topic to research. Should be a single topic, and should be described in high detail (at least a paragraph)."
    ),
});
export type ConductResearchType = z.infer<typeof ConductResearch>;

export const ResearchComplete = z.object({});
export type ResearchCompleteType = z.infer<typeof ResearchComplete>;

export const Summary = z.object({
  summary: z.string(),
  keyExcerpts: z.string(),
});
export type SummaryType = z.infer<typeof Summary>;

export const ClarifyWithUser = z.object({
  needClarification: z
    .boolean()
    .describe("Whether the user needs to be asked a clarifying question."),
  question: z
    .string()
    .describe("A question to ask the user to clarify the report scope."),
  verification: z
    .string()
    .describe(
      "Verify message that we will start research after the user has provided the necessary information."
    ),
});
export type ClarifyWithUserType = z.infer<typeof ClarifyWithUser>;

export const ResearchQuestion = z.object({
  researchBrief: z
    .string()
    .describe("A research question that will be used to guide the research."),
});
export type ResearchQuestionType = z.infer<typeof ResearchQuestion>;

export const MessageLike = z.record(z.any());
export type MessageLikeType = z.infer<typeof MessageLike>;
import { BaseMessageLike } from '@langchain/core/messages'

export const MessagesState = z.object({
  messages: z.array(MessageLike).optional(),
});
export type MessagesStateType = z.infer<typeof MessagesState>;

export const AgentInputState = MessagesState.extend({});
export type AgentInputState = z.infer<typeof AgentInputState>;

export const AgentState = MessagesState.extend({
  supervisorMessages: z.array(MessageLike),
  researchBrief: z.string().optional(),
  rawNotes: z.array(z.string()),
  notes: z.array(z.string()),
  finalReport: z.string(),
});
export type AgentState = z.infer<typeof AgentState>;

export const SupervisorState = z.object({
  supervisorMessages: z.array(MessageLike),
  researchBrief: z.string(),
  notes: z.array(z.string()),
  researchIterations: z.number(),
  rawNotes: z.array(z.string()),
});
export type SupervisorState = z.infer<typeof SupervisorState>;

export const ResearcherState = z.object({
  researcherMessages: z.array(MessageLike),
  toolCallIterations: z.number(),
  researchTopic: z.string(),
  compressedResearch: z.string(),
  rawNotes: z.array(z.string()),
});
export type ResearcherState = z.infer<typeof ResearcherState>;

export const ResearcherOutputState = z.object({
  compressedResearch: z.string(),
  rawNotes: z.array(z.string()).default([]),
});
export type ResearcherOutputState = z.infer<typeof ResearcherOutputState>;
