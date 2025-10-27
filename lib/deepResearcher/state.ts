import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Annotation for ConductResearch event state.
 */
export const ConductResearch = Annotation<{ researchTopic: string }>({
  reducer: (current, update) => ({
    researchTopic: update?.researchTopic ?? current?.researchTopic ?? "",
  }),
  default: () => ({ researchTopic: "" }),
});

/**
 * Annotation for ResearchComplete event state (empty state).
 */
export const ResearchComplete = Annotation<{}>({
  reducer: (current, update) => ({}),
  default: () => ({}),
});

/**
 * Annotation for Summary event state.
 */
export const Summary = Annotation<{ summary: string; keyExcerpts: string }>({
  reducer: (current, update) => ({
    summary: update?.summary ?? current?.summary ?? "",
    keyExcerpts: update?.keyExcerpts ?? current?.keyExcerpts ?? "",
  }),
  default: () => ({ summary: "", keyExcerpts: "" }),
});

/**
 * Annotation for clarifying with user.
 */
export const ClarifyWithUser = Annotation<{
  needClarification: boolean;
  question?: string;
  verification?: string;
}>({
  reducer: (current, update) => ({
    needClarification:
      update?.needClarification ?? current?.needClarification ?? false,
    question: update?.question ?? current?.question,
    verification: update?.verification ?? current?.verification,
  }),
  default: () => ({ needClarification: false }),
});

/**
 * Annotation for ResearchQuestion event state.
 */
export const ResearchQuestion = Annotation<{ researchBrief: string }>({
  reducer: (current, update) => ({
    researchBrief: update?.researchBrief ?? current?.researchBrief ?? "",
  }),
  default: () => ({ researchBrief: "" }),
});

/**
 * MessageLike annotation and types.
 */
export const MessageLike = Annotation<Record<string, any>>({
  reducer: (current, update) => ({ ...current, ...update }),
  default: () => ({}),
});

export type ConductResearch = typeof ConductResearch.ValueType;
export type ResearchComplete = typeof ResearchComplete.ValueType;
export type Summary = typeof Summary.ValueType;
export type ClarifyWithUser = typeof ClarifyWithUser.ValueType;
export type ResearchQuestion = typeof ResearchQuestion.ValueType;
export type MessageLike = typeof MessageLike.ValueType;

/**
 * Messages state as annotation.
 */
export const MessagesState = Annotation<{
  messages?: MessageLike[];
}>({
  reducer: (current, update) => ({
    messages: (current?.messages || []).concat(update?.messages || []),
  }),
  default: () => ({ messages: [] }),
});

export type MessagesState = typeof MessagesState.ValueType;

/**
 * AgentInputState extends MessagesState annotation.
 */
export const AgentInputState = Annotation<{
  messages?: MessageLike[];
}>({
  reducer: (current, update) => ({
    messages: (current?.messages || []).concat(update?.messages || []),
  }),
  default: () => ({ messages: [] }),
});

export type AgentInputState = typeof AgentInputState.ValueType;

/**
 * ResearcherState as root annotation.
 */
export const ResearcherState = Annotation.Root({
  researcherMessages: Annotation<MessageLike[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),
  toolCallIterations: Annotation<number>({
    reducer: (current, update) =>
      update ?? current ?? 0,
    default: () => 0,
  }),
  researchTopic: Annotation<string>({
    reducer: (current, update) => update ?? current ?? "",
    default: () => "",
  }),
  compressedResearch: Annotation<string>({
    reducer: (current, update) => update ?? current ?? "",
    default: () => "",
  }),
  rawNotes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),
});

export type ResearcherState = typeof ResearcherState.State;

/**
 * ResearcherOutputState as annotation.
 */
export const ResearcherOutputState = Annotation<{
  compressedResearch: string;
  rawNotes: string[];
}>({
  reducer: (current, update) => ({
    compressedResearch:
      update?.compressedResearch ?? current?.compressedResearch ?? "",
    rawNotes: (current?.rawNotes || []).concat(update?.rawNotes || []),
  }),
  default: () => ({ compressedResearch: "", rawNotes: [] }),
});

export type ResearcherOutputState = typeof ResearcherOutputState.ValueType;

/**
 * Main agent state that tracks research progress and findings using Annotation.
 */
export const AgentState = Annotation.Root({
  // Conversation messages (shared)
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),

  // Supervisor-specific messages
  supervisorMessages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),

  // Research brief/topic
  researchBrief: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "",
  }),

  researchOutline: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "",
  }),

  // Notes/findings
  notes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),

  // Final report
  finalReport: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "",
  }),
});

export type AgentState = typeof AgentState.State;

/**
 * Supervisor subgraph state using Annotation.
 */
export const SupervisorState = Annotation.Root({
  // Shared conversation messages
  messages: Annotation<MessageLike[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),

  // Supervisor's messages
  supervisorMessages: Annotation<BaseMessage[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),

  // Notes from researchers
  notes: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current || [];
      if (!current) return update;
      return current.concat(update);
    },
    default: () => [],
  }),

  // Research brief
  researchBrief: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "",
  }),

  // Number of research iterations
  researchIterations: Annotation<number>({
    reducer: (current, update) => update ?? current,
    default: () => 0,
  }),
});

export type SupervisorState = typeof SupervisorState.State;