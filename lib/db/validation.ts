import { z } from 'zod';

// Base schemas for nested types
export const ScoreWeightSchema = z.object({
  market_demand: z.number(),
  de_risking_automation: z.number(),
  transferability: z.number(),
  salary_potential: z.number(),
  time_to_break_in: z.number(),
});

export const ScoreBreakdownSchema = z.object({
  final: z.number(),
  automation_risk: z.number(),
  market_demand: z.number(),
  transferability: z.number(),
  salary_potential: z.number(),
  time_to_break_in: z.number(),
  weights: ScoreWeightSchema,
});

export const EvidenceSchema = z.object({
  claim: z.string(),
  rationale: z.string(),
});

export const ResourceSchema = z.object({
  type: z.enum(['course', 'book', 'yt', 'project', 'cert', 'article', 'doc']),
  title: z.string(),
  provider: z.string().optional(),
  est_hours: z.number().optional(),
});

export const MissingSkillSchema = z.object({
  skill: z.string(),
  why_it_matters: z.string(),
  estimated_learning_hours: z.number(),
  learning_sequence_order: z.number(),
  resources: z.array(ResourceSchema),
});

export const SalarySchema = z.object({
  currency: z.string(),
  p50: z.number().optional(),
  p90: z.number().optional(),
  note: z.string().optional(),
});

export const EntryPathSchema = z.object({
  time_to_break_in_months: z.number(),
  starter_projects: z.array(z.string()),
  certs: z.array(z.string()).optional(),
  proof_of_work_assets: z.array(z.string()),
});

export const OutreachTemplatesSchema = z.object({
  cold_dm: z.string(),
  linkedin_about: z.string(),
  resume_headline: z.string(),
});

export const SuggestionSchema = z.object({
  title: z.string(),
  short_pitch: z.string(),
  why_future_proof: z.string(),
  automation_risk: z.number(),
  market_demand: z.number(),
  salary: SalarySchema,
  transferable_skills: z.array(z.string()),
  missing_skills: z.array(MissingSkillSchema),
  entry_path: EntryPathSchema,
  first_14_days: z.array(z.string()),
  outreach_templates: OutreachTemplatesSchema,
  score_breakdown: ScoreBreakdownSchema,
  evidence: z.array(EvidenceSchema),
});

export const DecisionRowSchema = z.object({
  title: z.string(),
  final_score: z.number(),
  automation_risk: z.number(),
  market_demand: z.number(),
  transferability: z.number(),
  salary_potential: z.number(),
  time_to_break_in: z.number(),
});

export const MetadataSchema = z.object({
  titles: z.array(z.string()),
  highlights: z.array(z.string()),
  best_path: z.string(),
  summary: z.string(),
  scores: z.array(z.object({
    title: z.string(),
    score: z.number(),
  })),
});

export const MetaSchema = z.object({
  candidate_count: z.number(),
  generated_at: z.string(),
  notes: z.string().optional(),
});

// Main report validation schema
export const ReportDataSchema = z.object({
  meta: MetaSchema,
  metadata: MetadataSchema,
  decision_matrix: z.array(DecisionRowSchema),
  suggestions: z.array(SuggestionSchema),
  global_rationale: z.string(),
});

// Type exports for use in your application
export type ValidatedMeta = z.infer<typeof MetaSchema>;
export type ValidatedMetadata = z.infer<typeof MetadataSchema>;
export type ValidatedDecisionMatrix = z.infer<typeof DecisionRowSchema>[];
export type ValidatedSuggestions = z.infer<typeof SuggestionSchema>[];
export type ValidatedReportData = z.infer<typeof ReportDataSchema>; 