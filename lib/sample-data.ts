/** =========================
 *  Example careerpathresponse
 *  ========================= */

import { Report } from "@/lib/types";

export const SAMPLE_DATA: Report = {
    id: "1",
    userId: "1",
    metadata: {
      user: {
        id: 1,
        name: 'Sample User',
        email: 'edna888@gmail.com'
      },
      candidate_count: 4,
      generated_at: '2025-07-26T12:00:00-07:00',
      createdAt: '2025-07-26T12:00:00-07:00',
      updatedAt:'2025-07-26T12:00:00-07:00',
      notes:
        'Weights applied per prompt. Final scores rounded to nearest integer for readability.',
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
    decisionMatrix: [
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
    globalRationale:
      'Given the user’s 6-month timeline, $250k target, and strong finance/communication skills, paths that tightly couple finance domain expertise with technical or regulatory leverage score best. Building the automation (AI Automation & Data Engineer) or governing it (Model Risk & AI Governance) both de-risk automation and preserve upside. Analytics Engineering is highly transferable and fast to show value with proof-of-work, but may undershoot the salary ceiling. Data PM is viable, but has slightly higher automation risk and competitive entry dynamics; strong PRD/metrics artifacts are mandatory to differentiate.',
  };