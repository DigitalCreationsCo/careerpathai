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
// export type ClarifyWithUserType = z.infer<typeof ClarifyWithUser>;

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

// export const AgentState = MessagesState.extend({
//   supervisorMessages: z.array(MessageLike),
//   researchBrief: z.string().optional(),
//   rawNotes: z.array(z.string()),
//   notes: z.array(z.string()),
//   finalReport: z.string(),
// });
// export type AgentState = z.infer<typeof AgentState>;

// export const SupervisorState = z.object({
//   supervisorMessages: z.array(MessageLike),
//   researchBrief: z.string(),
//   notes: z.array(z.string()),
//   researchIterations: z.number(),
//   rawNotes: z.array(z.string()),
// });
// export type SupervisorState = z.infer<typeof SupervisorState>;

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


/**
 * Clarification decision structure
 */
export interface ClarifyWithUser {
  needClarification: boolean;
  question?: string;
  verification?: string;
}

export type ClarifyWithUserType = typeof ClarifyWithUser;

// Export state types for use in nodes
export type AgentState = typeof AgentState.State;
export type SupervisorState = typeof SupervisorState.State;

// ============================================
// state.ts - UPDATED with shared state
// ============================================
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Main agent state that tracks research progress and findings
 */
export const AgentState = Annotation.Root({
  // Core conversation messages - SHARED with supervisor
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),

  // Supervisor-specific messages, e.g., instructions for supervisor
  supervisorMessages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  
  // Research brief/topic generated from user input
  researchBrief: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
 
  researchOutline: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  
  // Research notes/findings collected during research
  notes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  
  // Final compiled research report
  finalReport: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
});

/**
 * Supervisor subgraph state - SHARES messages with parent
 */
export const SupervisorState = Annotation.Root({
  // CRITICAL: Use same messages field as parent graph
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),

  // Supervisor-specific messages, e.g., instructions for supervisor
  supervisorMessages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  
  // Notes collected by researchers
  notes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  
  // Research brief passed from parent graph
  researchBrief: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),

  // Number of research iterations completed
  researchIterations: Annotation<number>({
    reducer: (current, update) => update ?? current,
    default: () => 0
  }),
});