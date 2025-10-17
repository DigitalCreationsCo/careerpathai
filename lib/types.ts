import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
// import type { ArtifactKind } from "@/components/artifact";
// import type { createDocument } from "./ai/tools/create-document";
// import type { getWeather } from "./ai/tools/get-weather";
// import type { requestSuggestions } from "./ai/tools/request-suggestions";
// import type { updateDocument } from "./ai/tools/update-document";
import type { AppUsage } from "./usage";
import { activityLogs, chats, messages, reports, researchSessions, stream, teamMembers, teams, users } from "./db/schema";

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Stream = typeof stream.$inferSelect;
export type NewStream = typeof stream.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamDataWithMembers = Team & {
  members: TeamMember[]
};

export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ResearchSession = typeof researchSessions.$inferSelect;
export type NewResearchSession = typeof researchSessions.$inferInsert;

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// type weatherTool = InferUITool<typeof getWeather>;
// type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
// type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
// type requestSuggestionsTool = InferUITool<
//   ReturnType<typeof requestSuggestions>
// >;

export type ChatTools = {
  // getWeather: weatherTool;
  // createDocument: createDocumentTool;
  // updateDocument: updateDocumentTool;
  // requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  // suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: string;
  // kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};


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

export type CareerPathSuggestion = {
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

export type DecisionRow = {
  title: string;
  final_score: number;
  automation_risk: number;
  market_demand: number;
  transferability: number;
  salary_potential: number;
  time_to_break_in: number;
};

export type Metadata = {
  titles: string[];
  highlights: string[];
  best_path: string;
  summary: string;
  scores: { title: string; score: number }[];
  candidate_count: number;
  generated_at: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  user: {
    id: number;
    name: string;
    email: string;
  }
};

export type CareerPathResponse = {
  metadata: Metadata;
  decision_matrix: DecisionRow[];
  suggestions: CareerPathSuggestion[];
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
