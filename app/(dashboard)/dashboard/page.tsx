import React from 'react';

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

type Suggestion = {
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

type DecisionRow = {
  title: string;
  final_score: number;
  automation_risk: number;
  market_demand: number;
  transferability: number;
  salary_potential: number;
  time_to_break_in: number;
};

type Metadata = {
  titles: string[];
  highlights: string[];
  best_path: string;
  summary: string;
  scores: { title: string; score: number }[];
};

type Meta = {
  candidate_count: number;
  generated_at: string;
  notes?: string;
};

type CareerPathResponse = {
  meta: Meta;
  metadata: Metadata;
  decision_matrix: DecisionRow[];
  suggestions: Suggestion[];
  global_rationale: string;
};

/** =========================
 *  Helpers
 *  ========================= */
const pct = (n: number) => `${n}%`;
const formatCurrency = (n?: number, currency: string = 'USD') =>
  n == null
    ? '-'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Simple score bar */
const ScoreBar: React.FC<{ value: number; label?: string }> = ({
  value,
  label,
}) => (
  <div className='w-full'>
    {label && (
      <div className='flex justify-between text-sm mb-1'>
        <span>{label}</span>
        <span>{pct(value)}</span>
      </div>
    )}
    <div className='h-2 bg-gray-200 rounded'>
      <div
        className='h-2 rounded bg-blue-500'
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  </div>
);

/** Generically styled section */
const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className }) => (
  <section className={`mb-8 break-inside-avoid ${className ?? ''}`}>
    <h2 className='text-2xl font-bold mb-4 border-b pb-2'>{title}</h2>
    {children}
  </section>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className='mb-6'>
    <h3 className='text-lg font-semibold mb-2'>{title}</h3>
    {children}
  </div>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className='inline-block text-sm bg-gray-100 rounded px-2 py-1 mr-2 mb-2'>
    {children}
  </span>
);

const KeyValue: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className='flex justify-between gap-4 py-1'>
    <span className='font-medium text-gray-600'>{label}</span>
    <span className='text-gray-900 text-right'>{value}</span>
  </div>
);

/** =========================
 *  Main Component
 *  ========================= */
export const CareerPathReport: React.FC<{ data: CareerPathResponse }> = ({
  data,
}) => {
  const { meta, metadata, decision_matrix, suggestions, global_rationale } =
    data;

  return (
    <div className='min-h-screen bg-white text-gray-900 p-6 md:p-12 print:p-4'>
      <style>{printStyles}</style>

      {/* Header */}
      <header className='mb-8 flex items-start justify-between print:mb-4'>
        <div>
          <h1 className='text-3xl font-bold'>
            CareerPath AI — Low-Risk, High-Upside Paths
          </h1>
          <p className='text-gray-500'>
            Generated: {fmtDate(meta.generated_at)} · Candidates:{' '}
            {meta.candidate_count}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className='hidden md:inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 print:hidden'
        >
          Print / Save PDF
        </button>
      </header>

      {/* Meta */}
      <Section title='Meta'>
        <div className='grid md:grid-cols-3 gap-4'>
          <KeyValue label='Candidate Count' value={meta.candidate_count} />
          <KeyValue label='Generated At' value={fmtDate(meta.generated_at)} />
          {meta.notes && <KeyValue label='Notes' value={meta.notes} />}
        </div>
      </Section>

      {/* Quick Preview */}
      <Section title='Quick Preview'>
        <SubSection title='Titles'>
          <div className='flex flex-wrap'>
            {metadata.titles.map(t => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </SubSection>

        <SubSection title='Highlights'>
          <ul className='list-disc ml-6'>
            {metadata.highlights.map((h, i) => (
              <li key={i} className='mb-1'>
                {h}
              </li>
            ))}
          </ul>
        </SubSection>

        <div className='grid md:grid-cols-2 gap-6'>
          <SubSection title='Best Path'>
            <p className='font-semibold'>{metadata.best_path}</p>
          </SubSection>

          <SubSection title='Summary'>
            <p>{metadata.summary}</p>
          </SubSection>
        </div>

        <SubSection title='Scores (Overall)'>
          <div className='space-y-3'>
            {metadata.scores.map(s => (
              <div key={s.title}>
                <ScoreBar value={s.score} label={s.title} />
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* Decision Matrix */}
      <Section title='Decision Matrix'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border border-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <Th>Title</Th>
                <Th>Final</Th>
                <Th>Automation Risk</Th>
                <Th>Market Demand</Th>
                <Th>Transferability</Th>
                <Th>Salary Potential</Th>
                <Th>Time to Break-In</Th>
              </tr>
            </thead>
            <tbody>
              {decision_matrix.map(row => (
                <tr key={row.title} className='border-t'>
                  <Td>{row.title}</Td>
                  <Td>{row.final_score}</Td>
                  <Td>{row.automation_risk}</Td>
                  <Td>{row.market_demand}</Td>
                  <Td>{row.transferability}</Td>
                  <Td>{row.salary_potential}</Td>
                  <Td>{row.time_to_break_in}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Suggestions */}
      <Section title='Suggestions'>
        <div className='space-y-10'>
          {suggestions.map((s, idx) => (
            <article
              key={s.title}
              className='border border-gray-200 rounded-lg p-5 shadow-sm break-inside-avoid'
            >
              <header className='mb-4'>
                <h3 className='text-xl font-bold'>
                  {idx + 1}. {s.title}
                </h3>
                <p className='text-gray-600 italic'>{s.short_pitch}</p>
              </header>

              <SubSection title="Why It's Future-Proof">
                <p>{s.why_future_proof}</p>
              </SubSection>

              <div className='grid md:grid-cols-2 gap-6'>
                <SubSection title='Top-Level Scores'>
                  <div className='space-y-2'>
                    <ScoreBar
                      value={s.automation_risk}
                      label='Automation Risk (lower is better)'
                    />
                    <ScoreBar value={s.market_demand} label='Market Demand' />
                  </div>
                </SubSection>

                <SubSection title='Salary'>
                  <KeyValue
                    label='Median (p50)'
                    value={formatCurrency(s.salary.p50, s.salary.currency)}
                  />
                  <KeyValue
                    label='Top (p90)'
                    value={formatCurrency(s.salary.p90, s.salary.currency)}
                  />
                  {s.salary.note && (
                    <KeyValue label='Note' value={s.salary.note} />
                  )}
                </SubSection>
              </div>

              <SubSection title='Transferable Skills'>
                <div className='flex flex-wrap'>
                  {s.transferable_skills.map(sk => (
                    <Tag key={sk}>{sk}</Tag>
                  ))}
                </div>
              </SubSection>

              <SubSection title='Missing Skills & Learning Plan'>
                {s.missing_skills
                  .sort(
                    (a, b) =>
                      a.learning_sequence_order - b.learning_sequence_order
                  )
                  .map(ms => (
                    <div
                      key={ms.skill}
                      className='mb-4 border-l-4 border-blue-500 pl-4'
                    >
                      <h4 className='font-semibold'>
                        {ms.learning_sequence_order}. {ms.skill}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {ms.why_it_matters}
                      </p>
                      <p className='text-sm'>
                        Estimated hours: {ms.estimated_learning_hours}
                      </p>
                      <div className='mt-2 overflow-x-auto'>
                        <table className='w-full text-sm border border-gray-200'>
                          <thead className='bg-gray-50'>
                            <tr>
                              <Th>Type</Th>
                              <Th>Title</Th>
                              <Th>Provider</Th>
                              <Th>Est. Hours</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {ms.resources.map((r, i) => (
                              <tr key={i} className='border-t'>
                                <Td>{r.type}</Td>
                                <Td>{r.title}</Td>
                                <Td>{r.provider ?? '-'}</Td>
                                <Td>{r.est_hours ?? '-'}</Td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </SubSection>

              <div className='grid md:grid-cols-2 gap-6'>
                <SubSection title='Entry Path'>
                  <KeyValue
                    label='Time to Break-In (months)'
                    value={s.entry_path.time_to_break_in_months}
                  />
                  <div className='mt-2'>
                    <h4 className='font-medium mb-1'>Starter Projects</h4>
                    <ul className='list-disc ml-6 text-sm'>
                      {s.entry_path.starter_projects.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  {s.entry_path.certs && s.entry_path.certs.length > 0 && (
                    <div className='mt-2'>
                      <h4 className='font-medium mb-1'>Certifications</h4>
                      <ul className='list-disc ml-6 text-sm'>
                        {s.entry_path.certs.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </SubSection>

                <SubSection title='Proof of Work Assets'>
                  <ul className='list-disc ml-6 text-sm'>
                    {s.entry_path.proof_of_work_assets.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </SubSection>
              </div>

              <SubSection title='First 14 Days'>
                <ol className='list-decimal ml-6 text-sm space-y-1'>
                  {s.first_14_days.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ol>
              </SubSection>

              <SubSection title='Outreach Templates'>
                <div className='space-y-4 text-sm'>
                  <div>
                    <h4 className='font-semibold mb-1'>Cold DM</h4>
                    <pre className='bg-gray-100 p-3 rounded whitespace-pre-wrap'>
                      {s.outreach_templates.cold_dm}
                    </pre>
                  </div>
                  <div>
                    <h4 className='font-semibold mb-1'>LinkedIn About</h4>
                    <pre className='bg-gray-100 p-3 rounded whitespace-pre-wrap'>
                      {s.outreach_templates.linkedin_about}
                    </pre>
                  </div>
                  <div>
                    <h4 className='font-semibold mb-1'>Resume Headline</h4>
                    <pre className='bg-gray-100 p-3 rounded whitespace-pre-wrap'>
                      {s.outreach_templates.resume_headline}
                    </pre>
                  </div>
                </div>
              </SubSection>

              <SubSection title='Score Breakdown'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm border border-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <Th>Metric</Th>
                        <Th>Score</Th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className='border-t'>
                        <Td>Final</Td>
                        <Td>{s.score_breakdown.final}</Td>
                      </tr>
                      <tr className='border-t'>
                        <Td>Automation Risk</Td>
                        <Td>{s.score_breakdown.automation_risk}</Td>
                      </tr>
                      <tr className='border-t'>
                        <Td>Market Demand</Td>
                        <Td>{s.score_breakdown.market_demand}</Td>
                      </tr>
                      <tr className='border-t'>
                        <Td>Transferability</Td>
                        <Td>{s.score_breakdown.transferability}</Td>
                      </tr>
                      <tr className='border-t'>
                        <Td>Salary Potential</Td>
                        <Td>{s.score_breakdown.salary_potential}</Td>
                      </tr>
                      <tr className='border-t'>
                        <Td>Time to Break-In</Td>
                        <Td>{s.score_breakdown.time_to_break_in}</Td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className='font-semibold mt-4 mb-2'>Weights</h4>
                <div className='grid md:grid-cols-2 gap-2 text-sm'>
                  <KeyValue
                    label='Market Demand'
                    value={s.score_breakdown.weights.market_demand}
                  />
                  <KeyValue
                    label='De-risking Automation'
                    value={s.score_breakdown.weights.de_risking_automation}
                  />
                  <KeyValue
                    label='Transferability'
                    value={s.score_breakdown.weights.transferability}
                  />
                  <KeyValue
                    label='Salary Potential'
                    value={s.score_breakdown.weights.salary_potential}
                  />
                  <KeyValue
                    label='Time to Break-in'
                    value={s.score_breakdown.weights.time_to_break_in}
                  />
                </div>
              </SubSection>

              <SubSection title='Evidence'>
                <ul className='list-disc ml-6 text-sm'>
                  {s.evidence.map((e, i) => (
                    <li key={i}>
                      <span className='font-semibold'>Claim:</span> {e.claim}
                      <br />
                      <span className='font-semibold'>Rationale:</span>{' '}
                      {e.rationale}
                    </li>
                  ))}
                </ul>
              </SubSection>
            </article>
          ))}
        </div>
      </Section>

      {/* Global Rationale */}
      <Section title='Global Rationale'>
        <p>{global_rationale}</p>
      </Section>

      <footer className='text-xs text-gray-400 mt-16 print:mt-4'>
        Generated by CareerPath AI
      </footer>
    </div>
  );
};

/** Simple table cell helpers */
const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className='text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600'>
    {children}
  </th>
);
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className='px-3 py-2 align-top'>{children}</td>
);

/** Print styles */
const printStyles = `
@media print {
  @page {
    margin: 16mm;
  }
  .print\\:hidden { display: none !important; }
  .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
  section { page-break-after: auto; }
  article { page-break-inside: avoid; }
}
`;

/** =========================
 *  Example usage
 *  ========================= */
// Paste the JSON you received into SAMPLE_DATA to demo locally
export const SAMPLE_DATA: CareerPathResponse = {
  meta: {
    candidate_count: 4,
    generated_at: '2025-07-26T12:00:00-07:00',
    notes:
      'Weights applied per prompt. Final scores rounded to nearest integer for readability.',
  },
  metadata: {
    titles: [
      'AI Automation & Data Engineer (Finance Ops)',
      'Model Risk & AI Governance Manager',
      'Analytics Engineering Lead (dbt/Snowflake)',
      'Data Product Manager (AI/Fintech)',
    ],
    highlights: [
      'All paths can be broken into < 6 months with ~13 hrs/week.',
      'Every option targets $200k–$350k total comp with low-to-moderate automation risk.',
      'Proof-of-work assets (repos, dashboards, governance memos) are central to fast hiring.',
      'The top path compounds your finance + ops strengths while you automate everyone else.',
    ],
    best_path: 'AI Automation & Data Engineer (Finance Ops)',
    summary:
      'You can pivot into AI-powered automation and data engineering for finance in ~5 months while preserving high salary upside and low automation risk. Model risk & AI governance is a close second for maximal stability and resilience.',
    scores: [
      { title: 'AI Automation & Data Engineer (Finance Ops)', score: 85 },
      { title: 'Model Risk & AI Governance Manager', score: 80 },
      { title: 'Analytics Engineering Lead (dbt/Snowflake)', score: 76 },
      { title: 'Data Product Manager (AI/Fintech)', score: 70 },
    ],
  },
  decision_matrix: [
    {
      title: 'AI Automation & Data Engineer (Finance Ops)',
      final_score: 85,
      automation_risk: 20,
      market_demand: 85,
      transferability: 90,
      salary_potential: 88,
      time_to_break_in: 80,
    },
    {
      title: 'Model Risk & AI Governance Manager',
      final_score: 80,
      automation_risk: 15,
      market_demand: 75,
      transferability: 80,
      salary_potential: 90,
      time_to_break_in: 70,
    },
    {
      title: 'Analytics Engineering Lead (dbt/Snowflake)',
      final_score: 76,
      automation_risk: 35,
      market_demand: 80,
      transferability: 85,
      salary_potential: 78,
      time_to_break_in: 75,
    },
    {
      title: 'Data Product Manager (AI/Fintech)',
      final_score: 70,
      automation_risk: 40,
      market_demand: 70,
      transferability: 75,
      salary_potential: 85,
      time_to_break_in: 65,
    },
  ],
  suggestions: [
    {
      title: 'AI Automation & Data Engineer (Finance Ops)',
      short_pitch:
        'Use Python/SQL + cloud + LLM tooling to automate reporting, reconciliations, and controls in finance teams—own the pipelines that replace manual analyst work.',
      why_future_proof:
        'You’re building and maintaining the automation layer itself; demand rises as firms chase efficiency while needing people who understand both finance and production-grade data/AI systems.',
      automation_risk: 20,
      market_demand: 85,
      salary: {
        currency: 'USD',
        p50: 250000,
        p90: 320000,
        note: 'Total comp in large fintech/big tech or banks including bonus/equity.',
      },
      transferable_skills: [
        'Quantitative analysis',
        'Financial modeling to define KPIs & data contracts',
        'Stakeholder communication',
        'Process mapping & controls thinking',
      ],
      missing_skills: [
        {
          skill: 'Python for data engineering (pandas, typing, packaging)',
          why_it_matters:
            'Core language for automation, ETL, and LLM agent glue code.',
          estimated_learning_hours: 40,
          learning_sequence_order: 1,
          resources: [
            {
              type: 'course',
              title: 'Data Engineering with Python (ETL to production)',
              provider: 'Udemy',
              est_hours: 20,
            },
            {
              type: 'project',
              title:
                'Refactor month-end close Excel macros into a Python CLI with tests',
            },
          ],
        },
        {
          skill: 'Advanced SQL + dbt',
          why_it_matters:
            'You’ll productionize financial transforms and maintain data lineage.',
          estimated_learning_hours: 35,
          learning_sequence_order: 2,
          resources: [
            {
              type: 'course',
              title: 'dbt Fundamentals',
              provider: 'dbt Labs',
              est_hours: 8,
            },
            {
              type: 'project',
              title:
                'Build a P&L mart in Snowflake/BigQuery with dbt exposures',
            },
          ],
        },
        {
          skill: 'Airflow/Prefect + orchestration',
          why_it_matters:
            'You need scheduled, monitored, retry-able jobs for finance pipelines.',
          estimated_learning_hours: 25,
          learning_sequence_order: 3,
          resources: [
            {
              type: 'course',
              title: 'Prefect or Airflow in Production',
              provider: 'CoRise/Udemy',
              est_hours: 10,
            },
            { type: 'project', title: 'Automated daily GL reconciliation DAG' },
          ],
        },
        {
          skill: 'Cloud fundamentals (AWS IAM, S3, Lambda/ECS, Secrets)',
          why_it_matters: 'Deploy and secure automation in real environments.',
          estimated_learning_hours: 45,
          learning_sequence_order: 4,
          resources: [
            {
              type: 'course',
              title: 'AWS Certified Developer Associate (condensed)',
              provider: 'Stephane Maarek',
              est_hours: 25,
            },
            {
              type: 'project',
              title: 'Deploy a serverless financial KPI API to AWS',
            },
          ],
        },
        {
          skill: 'LLM integration & retrieval (OpenAI, LangChain, pgvector)',
          why_it_matters:
            'You’ll ship copilots for reconciliations, policy Q&A, & anomaly triage.',
          estimated_learning_hours: 40,
          learning_sequence_order: 5,
          resources: [
            {
              type: 'course',
              title: 'Practical LLMs & RAG for Production',
              provider: 'DeepLearning.AI',
              est_hours: 12,
            },
            {
              type: 'project',
              title:
                'Build a month-end close assistant that explains every variance with citations',
            },
          ],
        },
        {
          skill: 'CI/CD + testing for data pipelines',
          why_it_matters:
            'Finance needs auditability, reproducibility, and rollback confidence.',
          estimated_learning_hours: 20,
          learning_sequence_order: 6,
          resources: [
            {
              type: 'article',
              title: 'Testing data pipelines with Great Expectations',
            },
            {
              type: 'project',
              title:
                'Set up GitHub Actions to run dbt tests & unit tests on each PR',
            },
          ],
        },
      ],
      entry_path: {
        time_to_break_in_months: 5,
        starter_projects: [
          'Automate monthly financial reporting with a Python/dbt pipeline + Metabase',
          'Variance-explainer LLM agent with a retrieval layer over your financial warehouse',
          'Airflow DAG for GL-to-subledger reconciliation with alerting & Slack notifications',
        ],
        certs: [
          'AWS Developer Associate (optional)',
          'dbt Fundamentals (free)',
        ],
        proof_of_work_assets: [
          'Public repo with infra-as-code + CI/CD pipeline for a finance ETL',
          'Demo video of LLM variance-explainer powered by your warehouse',
          'Architecture diagram + runbook (on-call/resiliency) for the automated close',
        ],
      },
      first_14_days: [
        'Outline the 3 most painful manual finance workflows you’ve seen.',
        'Map each workflow to a measurable KPI (hours saved, error rate).',
        'Refresh Python fundamentals incl. packaging, logging, typing.',
        'Spin up a dockerized local dev env with Postgres + Airflow/Prefect.',
        'Build a tiny DAG that ingests CSV -> warehouse -> dbt model.',
        'Draft an LLM agent design doc for variance analysis + audit trail.',
        'Set up unit tests + dbt tests; enforce via pre-commit hooks.',
        'Publish initial repo README with project milestones & metrics.',
        'Design Snowflake/BigQuery schemas for P&L, balance sheet, cash flow.',
        'Add Great Expectations to validate financial transformations.',
        'Implement Slack/Email alerting on pipeline failure.',
        "Write a 1-pager: 'Automation ROI for Month-End Close' with numbers.",
        'Ship v0 of the LLM variance explainer with synthetic data.',
        'Book 5 calls with finance leaders to validate pain points & ROI.',
      ],
      outreach_templates: {
        cold_dm:
          'Hi {{Name}} — I’m a finance analyst (8 yrs banking) who now builds Python/dbt/LLM automations that cut close/reconciliation time by 40–70%. I’m prototyping an open repo that turns variance analysis into a queryable agent with full audit trail. Would a 15-min call to see if this fits your roadmap be useful?',
        linkedin_about:
          'Finance analyst (8y banking) turned AI/Data engineer. I build production-grade Python/dbt/Airflow + LLM copilots that automate month-end close, reconciliations, and controls with testing & observability baked in. Targeting measurable ROI: hours saved, fewer breaks, faster audits.',
        resume_headline:
          'Finance→AI Automation Engineer | Python/dbt/Airflow | LLM copilots for month-end close & reconciliations | $MM ROI in hours saved',
      },
      score_breakdown: {
        final: 85,
        automation_risk: 20,
        market_demand: 85,
        transferability: 90,
        salary_potential: 88,
        time_to_break_in: 80,
        weights: {
          market_demand: 0.3,
          de_risking_automation: 0.25,
          transferability: 0.2,
          salary_potential: 0.15,
          time_to_break_in: 0.1,
        },
      },
      evidence: [
        {
          claim:
            'Finance teams are rapidly adopting automation & AI copilots to compress close cycles.',
          rationale:
            'Cost pressure + compliance needs make robust, testable automation attractive; firms lack hybrid finance+engineering talent.',
        },
        {
          claim: 'Low automation risk.',
          rationale:
            'You are the one building and operating the automation; the meta-layer is harder to replace.',
        },
      ],
    },
    {
      title: 'Model Risk & AI Governance Manager',
      short_pitch:
        'Own AI/ML model governance, validation, testing, and documentation in regulated finance—where your banking background is a moat.',
      why_future_proof:
        'As AI permeates finance, regulators increase scrutiny; governance roles grow and resist automation.',
      automation_risk: 15,
      market_demand: 75,
      salary: {
        currency: 'USD',
        p50: 260000,
        p90: 350000,
        note: 'Senior roles in large banks/fintechs with bonus.',
      },
      transferable_skills: [
        'Controls & documentation discipline',
        'Critical thinking & risk framing',
        'Financial modeling validation logic',
        'Communication with auditors/regulators',
      ],
      missing_skills: [
        {
          skill: 'Model risk management frameworks (SR 11-7, EU AI Act basics)',
          why_it_matters:
            'You’ll design policies and testing standards aligned with regulation.',
          estimated_learning_hours: 25,
          learning_sequence_order: 1,
          resources: [
            {
              type: 'doc',
              title: 'SR 11-7 Supervisory Guidance',
              provider: 'Federal Reserve',
            },
            { type: 'article', title: 'EU AI Act summary for practitioners' },
          ],
        },
        {
          skill: 'ML fundamentals for validation (bias, drift, robustness)',
          why_it_matters: 'You must independently challenge model developers.',
          estimated_learning_hours: 45,
          learning_sequence_order: 2,
          resources: [
            {
              type: 'course',
              title: 'Machine Learning Specialization',
              provider: 'DeepLearning.AI',
              est_hours: 25,
            },
            {
              type: 'project',
              title:
                'Validate a credit risk model and produce a SR 11-7 styled report',
            },
          ],
        },
        {
          skill: 'LLM-specific risk (prompt injection, data leakage, evals)',
          why_it_matters:
            'Governance is different for generative models; you need evals & red-teaming.',
          estimated_learning_hours: 30,
          learning_sequence_order: 3,
          resources: [
            {
              type: 'article',
              title: 'Prompt injection & RAG risks: a taxonomy',
            },
            {
              type: 'project',
              title:
                'Design an LLM eval harness scoring factuality, toxicity, PII leakage',
            },
          ],
        },
        {
          skill: 'Documentation & audit trail automation',
          why_it_matters:
            'Scaling governance requires templated, reproducible reporting.',
          estimated_learning_hours: 15,
          learning_sequence_order: 4,
          resources: [
            {
              type: 'project',
              title:
                'Generate automated model cards + validation packs from notebooks',
            },
          ],
        },
      ],
      entry_path: {
        time_to_break_in_months: 6,
        starter_projects: [
          'Write a full SR 11-7 compliant validation for a public credit-scoring Kaggle model',
          'Build an LLM eval suite repo (toxicity/factuality/privacy) with dashboards',
          'Draft a bank-grade Model Risk Management (MRM) policy template',
        ],
        certs: [
          'FRM (optional, long-term)',
          'Responsible AI certifications (short vendor programs)',
        ],
        proof_of_work_assets: [
          'Public model validation report with reproducible code',
          'LLM eval harness repo + sample red-team findings',
          'Policy templates & governance workflow diagram',
        ],
      },
      first_14_days: [
        'Read SR 11-7 end-to-end and summarize each requirement in 1 line.',
        'List AI/ML model lifecycle stages with required controls for each.',
        'Pick a credit risk model; plan a full validation scope & methodology.',
        'Draft a standard model card & validation template doc.',
        'Study LLM-specific threats (prompt injection, training data leakage).',
        'Prototype an eval script for LLM factuality on a toy dataset.',
        'Create a checklist for model change management & monitoring.',
        'Draft policy language for human-in-the-loop overrides.',
        'Map monitoring metrics to alert thresholds (drift, bias, instability).',
        'Write a sample governance committee deck (key risks, mitigations).',
        'Automate PDF generation of validation packs from notebooks.',
        'Interview 3 model devs about what slows them down in governance.',
        'Design a lightweight risk-tiering rubric to reduce friction.',
        'Publish the repo & share with 5 governance leaders for feedback.',
      ],
      outreach_templates: {
        cold_dm:
          'Hi {{Name}}, I’m an 8-year banking analyst transitioning into Model Risk/AI Governance. I’ve built SR 11-7 style validation packs and an open-source LLM eval harness (toxicity, hallucinations, PII). Would a brief chat about your current governance pain points be helpful?',
        linkedin_about:
          'Finance analyst → Model Risk & AI Governance. I validate ML/LLM models, write SR 11-7-aligned policies, and automate documentation & evals. Focused on practical controls that speed delivery, not slow it.',
        resume_headline:
          'Model Risk & AI Governance | SR 11-7, LLM evals, bias/drift testing | Finance background, strong documentation & stakeholder skills',
      },
      score_breakdown: {
        final: 80,
        automation_risk: 15,
        market_demand: 75,
        transferability: 80,
        salary_potential: 90,
        time_to_break_in: 70,
        weights: {
          market_demand: 0.3,
          de_risking_automation: 0.25,
          transferability: 0.2,
          salary_potential: 0.15,
          time_to_break_in: 0.1,
        },
      },
      evidence: [
        {
          claim: 'Regulatory scrutiny on AI/ML in finance is intensifying.',
          rationale:
            'US & EU guidance (SR 11-7, EU AI Act) are expanding governance workload.',
        },
        {
          claim: 'Compensation meets/exceeds target.',
          rationale: 'Senior MRM roles in banks often exceed $250k with bonus.',
        },
      ],
    },
    {
      title: 'Analytics Engineering Lead (dbt/Snowflake)',
      short_pitch:
        'Own semantic layers, data contracts, and governed analytics for finance. You translate business KPIs into well-tested, versioned dbt models.',
      why_future_proof:
        'Well-modeled, governed data is the substrate for AI & decision-making; strong engineering rigor keeps this role resilient.',
      automation_risk: 35,
      market_demand: 80,
      salary: {
        currency: 'USD',
        p50: 200000,
        p90: 250000,
      },
      transferable_skills: [
        'KPI design & financial logic',
        'Stakeholder comms',
        'Requirements gathering and documentation',
        'Data quality sensitivity',
      ],
      missing_skills: [
        {
          skill: 'dbt at scale (exposures, tests, contracts)',
          why_it_matters:
            'Mission-critical to deliver trusted analytics in production.',
          estimated_learning_hours: 25,
          learning_sequence_order: 1,
          resources: [
            {
              type: 'course',
              title: 'dbt Advanced',
              provider: 'dbt Labs',
              est_hours: 10,
            },
            {
              type: 'project',
              title:
                'Build a fully tested finance mart with exposures + contracts',
            },
          ],
        },
        {
          skill:
            'Modern data stack ops (Snowflake/BigQuery, BI, metrics layers)',
          why_it_matters:
            'Operate a reliable analytics platform for finance stakeholders.',
          estimated_learning_hours: 35,
          learning_sequence_order: 2,
          resources: [
            {
              type: 'course',
              title: 'Snowflake Hands-On',
              provider: 'Coursera',
              est_hours: 12,
            },
            {
              type: 'project',
              title:
                'Implement a metrics layer with dbt + MetricFlow/Transform',
            },
          ],
        },
        {
          skill:
            'Orchestration & CI/CD for analytics (GitHub Actions, Slim CI)',
          why_it_matters: 'Prevents broken dashboards and increases trust.',
          estimated_learning_hours: 20,
          learning_sequence_order: 3,
          resources: [
            {
              type: 'article',
              title: 'Slim CI with dbt',
              provider: 'dbt Labs',
            },
            {
              type: 'project',
              title: 'Automate prod deployments w/ tests & docs site builds',
            },
          ],
        },
      ],
      entry_path: {
        time_to_break_in_months: 5,
        starter_projects: [
          'Finance KPI warehouse with dbt tests + exposures + docs',
          'Great Expectations data quality suite with alerts',
          'Metrics layer P&L dashboard with versioned definitions',
        ],
        certs: ['dbt Fundamentals/Advanced'],
        proof_of_work_assets: [
          'Public dbt repo with CI/CD and docs site',
          'Runbooks & lineage diagrams',
          'Dashboard gallery tied to versioned metrics',
        ],
      },
      first_14_days: [
        'Install & configure dbt with a warehouse (DuckDB/Snowflake).',
        'Model a simple P&L with staging/intermediate/mart layers.',
        'Add dbt tests (unique, not_null) + Great Expectations suite.',
        'Publish docs & lineage; share URL for feedback.',
        'Implement Slim CI on PR with GitHub Actions.',
        'Create a metrics spec for Gross Margin and Cash Conversion Cycle.',
        'Write a data contract (schema + SLA) with a mock upstream team.',
        'Add exposures to track downstream BI dashboards.',
        'Track model run times & cost; optimize heavy transforms.',
        'Add alerts to Slack/Email when tests fail.',
        'Draft an RFC for semantic layer adoption.',
        'Benchmark Snowflake vs DuckDB locally for dev speed.',
        'Refactor models for reusability & clarity.',
        'Create a template ‘analytics runbook’ for incidents.',
      ],
      outreach_templates: {
        cold_dm:
          'Hi {{Name}}, I’m a finance analyst transitioning into Analytics Engineering. I’ve shipped a public dbt repo with CI/CD, contracts, and a finance metrics layer (GM%, CAC Payback, CCC). If data trust/reliability is a pain, happy to show what I built in 15 mins.',
        linkedin_about:
          'Finance → Analytics Engineering Lead. I build governed metrics layers with dbt, Snowflake, and CI/CD so finance & ops teams trust their numbers.',
        resume_headline:
          'Analytics Engineering (dbt/Snowflake) | Finance KPIs, contracts, CI/CD, data quality & lineage',
      },
      score_breakdown: {
        final: 76,
        automation_risk: 35,
        market_demand: 80,
        transferability: 85,
        salary_potential: 78,
        time_to_break_in: 75,
        weights: {
          market_demand: 0.3,
          de_risking_automation: 0.25,
          transferability: 0.2,
          salary_potential: 0.15,
          time_to_break_in: 0.1,
        },
      },
      evidence: [
        {
          claim:
            'Analytics engineering remains a core bottleneck for trustworthy AI/BI.',
          rationale:
            'Organizations still struggle to operationalize metrics and governance.',
        },
        {
          claim:
            'Comp may be slightly below the $250k target unless in larger tech/fintech.',
          rationale: 'Hence the slightly lower salary score.',
        },
      ],
    },
    {
      title: 'Data Product Manager (AI/Fintech)',
      short_pitch:
        'Own AI/data products that automate financial workflows; combine finance fluency, data literacy, and GTM sense to ship high-ROI features.',
      why_future_proof:
        'PMs who deeply grasp AI/LLM capabilities + finance economics will be scarce and valuable; PM work shifts, but strategic/technical PMs stay relevant.',
      automation_risk: 40,
      market_demand: 70,
      salary: {
        currency: 'USD',
        p50: 220000,
        p90: 300000,
      },
      transferable_skills: [
        'Business case modeling',
        'Stakeholder alignment',
        'Prioritization & roadmap planning',
        'Clear written communication',
      ],
      missing_skills: [
        {
          skill: 'AI/LLM product patterns (RAG, evals, prompt safety)',
          why_it_matters:
            'You need to scope, prioritize, and measure AI features safely.',
          estimated_learning_hours: 25,
          learning_sequence_order: 1,
          resources: [
            {
              type: 'course',
              title: 'Building AI Products',
              provider: 'DeepLearning.AI',
              est_hours: 10,
            },
            {
              type: 'project',
              title:
                'Ship an LLM-powered financial anomaly triage prototype & PRD',
            },
          ],
        },
        {
          skill:
            'Product analytics (Amplitude/GA4, Experimentation, Metrics trees)',
          why_it_matters: 'You’ll define success metrics and iterate fast.',
          estimated_learning_hours: 20,
          learning_sequence_order: 2,
          resources: [
            {
              type: 'course',
              title: 'Product Analytics',
              provider: 'Reforge (if available)',
            },
            {
              type: 'project',
              title: 'Define metrics tree for close-cycle automation feature',
            },
          ],
        },
        {
          skill: 'Roadmapping & PRD rigor for technical teams',
          why_it_matters:
            'You must translate customer pain → technical specs that engineers trust.',
          estimated_learning_hours: 15,
          learning_sequence_order: 3,
          resources: [
            { type: 'book', title: 'Inspired', provider: 'Marty Cagan' },
            {
              type: 'project',
              title: 'Write a PRD with acceptance tests & analytics plan',
            },
          ],
        },
      ],
      entry_path: {
        time_to_break_in_months: 6,
        starter_projects: [
          'AI-powered month-end close assistant PRD + Fermi-modeled ROI',
          'Experimentation framework with guardrail metrics for FP&A automation',
          'Go-to-market one-pager for a compliance LLM copilot',
        ],
        certs: [],
        proof_of_work_assets: [
          'Portfolio of 3 PRDs (with analytics/eval plans)',
          'Metrics trees & dashboards',
          'User interview synthesis & JTBD docs',
        ],
      },
      first_14_days: [
        'Pick 2 painful finance workflows and write lean PRDs for both.',
        'Map success metrics (primary/guardrail) and instrumentation plan.',
        'Draft a lightweight LLM eval plan (hallucination rate, privacy).',
        'Run 5 mock user interviews and synthesize JTBD insights.',
        'Storyboard a v0 AI copilot UX for reconciliations.',
        'Write a roadmap with sequencing & dependency mapping.',
        'Design an experiment plan (A/B or CUPED) for ROI validation.',
        'Create a KPI tree linking product metrics to $ outcomes.',
        'Draft a 1-pager GTM for a finance AI assistant.',
        'Benchmark competing AI finance tools; note gaps/opportunities.',
        'Define pricing/packaging hypotheses tied to value metrics.',
        'Write a spec for data retention & governance requirements.',
        "Prepare a stakeholder memo: 'Risks & mitigations for AI in Close'.",
        'Publish portfolio site with PRDs, metrics trees, and interview notes.',
      ],
      outreach_templates: {
        cold_dm:
          'Hi {{Name}}, I’m a finance analyst moving into Data PM for AI/fintech. I’ve shipped PRDs + metrics trees for AI copilots that compress close cycles and automate reconciliations. Could I get 15 mins to learn about your roadmap and share what I’ve built?',
        linkedin_about:
          'Finance analyst → Data PM (AI/Fintech). I write PRDs, metrics trees, and eval plans for LLM products that automate finance workflows with measurable ROI.',
        resume_headline:
          'Data Product Manager (AI/Fintech) | PRDs, metrics trees, LLM eval plans | Finance background',
      },
      score_breakdown: {
        final: 70,
        automation_risk: 40,
        market_demand: 70,
        transferability: 75,
        salary_potential: 85,
        time_to_break_in: 65,
        weights: {
          market_demand: 0.3,
          de_risking_automation: 0.25,
          transferability: 0.2,
          salary_potential: 0.15,
          time_to_break_in: 0.1,
        },
      },
      evidence: [
        {
          claim:
            'Technical PMs with AI literacy are in demand but face competition.',
          rationale:
            'Many PMs are upskilling; differentiation needs strong proof-of-work.',
        },
        {
          claim: 'Compensation can hit target in scaled fintech/tech.',
          rationale: 'But higher variance than engineering/governance paths.',
        },
      ],
    },
  ],
  global_rationale:
    'Given the user’s 6-month timeline, $250k target, and strong finance/communication skills, paths that tightly couple finance domain expertise with technical or regulatory leverage score best. Building the automation (AI Automation & Data Engineer) or governing it (Model Risk & AI Governance) both de-risk automation and preserve upside. Analytics Engineering is highly transferable and fast to show value with proof-of-work, but may undershoot the salary ceiling. Data PM is viable, but has slightly higher automation risk and competitive entry dynamics; strong PRD/metrics artifacts are mandatory to differentiate.',
};

// Example mount (remove if integrating into your app/router)
export const App = () => {
  // replace SAMPLE_DATA with the real JSON
  return <CareerPathReport data={SAMPLE_DATA} />;
};
