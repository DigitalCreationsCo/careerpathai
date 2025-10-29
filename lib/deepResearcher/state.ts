
// ============================================
// lib/deepResearcher/state.ts
// ============================================

import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

/**
 * Annotation.Root with reducers for proper message accumulation
 * Zod schemas don't support reducers - they're just for validation
 */

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  supervisorMessages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  researchBrief: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  researchOutline: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  notes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  finalReport: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
});

export const SupervisorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  supervisorMessages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  notes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  researchBrief: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  researchOutline: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  researchIterations: Annotation<number>({
    reducer: (current, update) => update ?? current ?? 0,
    default: () => 0
  }),
});

export const ResearcherState = Annotation.Root({
  researcherMessages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
  toolCallIterations: Annotation<number>({
    reducer: (current, update) => update ?? current ?? 0,
    default: () => 0
  }),
  researchTopic: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  compressedResearch: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  rawNotes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => []
  }),
});

export type AgentState = typeof AgentState.State;
export type SupervisorState = typeof SupervisorState.State;
export type ResearcherState = typeof ResearcherState.State;

export const ConductResearch = z.object({
  researchTopic: z.string(),
});
export const ResearchComplete = z.object({});
export const Summary = z.object({
  summary: z.string(),
  keyExcerpts: z.string(),
});

export type ConductResearch = typeof ConductResearch._type;
export type ResearchComplete = typeof ResearchComplete._type;
export type Summary = typeof Summary._type;

export const ClarifyWithUser = z.object({
  needClarification: z.boolean(),
  question: z.string().optional(),
  verification: z.string().optional(),
});
export const ResearchQuestion = z.object({
  researchBrief: z.string(),
});
export const MessageLike = z.record(z.any());
export const MessagesState = z.object({
  messages: z.array(MessageLike).optional(),
});

export type ClarifyWithUser = typeof ClarifyWithUser._type;
export type ResearchQuestion = typeof ResearchQuestion._type;
export type MessageLike = typeof MessageLike._type;
export type MessagesState = typeof MessagesState._type;

export const AgentInputState = z.object({
  messages: z.array(MessageLike).optional(),
});

export type AgentInputState = typeof AgentInputState._type;

export const ResearcherOutputState = z.object({
  compressedResearch: z.string(),
  rawNotes: z.array(z.string()),
});

export type ResearcherOutputState = typeof ResearcherOutputState._type;