// ============================================
// lib/deepResearcher/state.ts
// ============================================

import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const MessageLike = z.record(z.any());
export const MessagesState = z.object({
  messages: z.array(MessageLike).optional(),
});

export type MessageLike = typeof MessageLike._type;
export type MessagesState = typeof MessagesState._type;

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
  reportPreview: Annotation<string>({
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

export const AgentInputState = z.object({
  messages: z.array(MessageLike).optional(),
});

export type AgentInputState = typeof AgentInputState._type;

export const ClarifyWithUser = z.object({
  needClarification: z.boolean(),
  question: z.string().optional(),
  verification: z.string().optional(),
});
export const ResearchQuestion = z.object({
  researchBrief: z.string(),
});

export type ClarifyWithUser = typeof ClarifyWithUser._type;
export type ResearchQuestion = typeof ResearchQuestion._type;

export const ConductResearch = tool(
  async ({ researchTopic }: { researchTopic: string }) => {
    // This is a placeholder - actual execution happens in supervisorTools
    return `Research task delegated: ${researchTopic}`;
  },
  {
    name: "ConductResearch",
    description: "Delegate a specific research task to a specialized researcher agent. Provide complete context and instructions in researchTopic parameter.",
    schema: z.object({
      researchTopic: z.string().describe("Complete research task description including what to research, what data to gather, and any specific requirements")
    })
  }
);

export const ResearchComplete = tool(
  async () => {
    // This is a signal tool - actual handling in supervisorTools
    return "Research phase completed";
  },
  {
    name: "ResearchComplete",
    description: "Signal that all necessary research has been completed and you're ready to move to report generation. Only use when outline is 80%+ complete.",
    schema: z.object({})
  }
);


export const Summary = z.object({
  summary: z.string(),
  keyExcerpts: z.string(),
});

export type ConductResearch = typeof ConductResearch;
export type ResearchComplete = typeof ResearchComplete;
export type Summary = typeof Summary._type;

export const ResearcherOutputState = z.object({
  compressedResearch: z.string(),
  rawNotes: z.array(z.string()),
});

export type ResearcherOutputState = typeof ResearcherOutputState._type;

export const FinalReportOutput = z.object({
  reportPreview: z.string().describe("Truncated preview version of the report for free users. Contains ONLY: (1) Truncated executive summary (50% length with ellipsis), (2) First flowchart diagram with salary ranges but NO role titles, (3) Call-to-action for full report purchase. Maximum 500 words."),
  finalReport: z.string().describe("Complete, comprehensive career path report following all specifications. 3,000-4,000 words with 15-20 diagrams, full analysis of all 4 paths, comparison matrices, action plans, and complete source list.")
});

export type FinalReportOutput = typeof FinalReportOutput._type;