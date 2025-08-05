TO DO:
- update landing page style w bg gradients: https://x.com/hewarsaber/status/1945394420607570295
- start a/b testing

- adapt 21 day pivot sprint into the product:
The 21-Day Pivot Sprint
A complete guide to pivot into a low-automation, high-value role fast.

Days 1–2: Identify 3 Adjacent Roles with Low Automation Risk
Goal: Pick roles that build on your existing skills but are harder for AI to replace.

Steps:

Search job boards (LinkedIn, Indeed, Wellfound) for:

"Low automation" fields

Roles in:

Skilled trades

Compliance, safety, governance

AI operations + oversight

Human-centered services

Cybersecurity, penetration testing

Map your skills:

List 5–10 things you do well now.

Match them to the roles above.

Pick 3 targets where you have at least 50% transferable skills.

Examples:

From Customer Support → Account Manager, Implementation Specialist, Client Success Lead.

From Data Entry → Compliance Analyst, Operations Coordinator, QA Documentation Specialist.

From Marketing → Growth Ops Specialist, CRM Automation Manager, Partner Program Manager.

Days 3–7: Learn 2 Core Skills + Clone a Real Workflow
Goal: Get functional in the tools & processes those roles use.

Steps:

Identify 2 skills that appear repeatedly in job descriptions.

Compliance Analyst → Risk audit logging, regulatory reporting.

Growth Ops → CRM automation, lead scoring.

Spend 10 hours total learning those skills:

YouTube tutorials

HubSpot Academy, Coursera, or LinkedIn Learning

Free vendor courses (Salesforce Trailhead, Airtable Academy, etc.)

Clone a real workflow:

Watch a tutorial for a relevant tool or process.

Recreate it with mock data.

Examples:

CRM Automation: Build an Airtable → HubSpot sync that tags leads automatically.

Compliance Tracker: Google Sheets dashboard logging weekly risk assessments.

Ops Report: BI dashboard pulling real-time inventory + sales data.

Days 8–14: Ship a Proof-of-Work Asset (Public)
Goal: Create a visible, shareable work sample that proves your ability.

Steps:

Package your cloned workflow so others can interact with it:

Loom Video: 2–3 minute walkthrough of your build.

GitHub Repo: Scripts, workflow instructions, sample data.

Notion Template: Pre-built dashboards or trackers.

Share it in relevant spaces:

LinkedIn post with demo link.

Tweet with a 1–2 sentence hook about the problem it solves.

Relevant Slack/Discord communities.

Examples:

“I built an AI-assisted compliance tracker that reduces audit prep time by 50%. Here’s a quick demo: [link]”

“This HubSpot automation saves 6 hrs/week on lead management. Full walkthrough here: [link]”

Days 15–21: Send 50 Value-First DMs to Hiring Managers
Goal: Get your proof-of-work in front of decision-makers.

Steps:

Build a target list:

Search LinkedIn for managers hiring your chosen roles.

Check company career pages.

Add to a spreadsheet.

Send 10 DMs/day for 5 days:

Keep them short, specific, and about them.

Example:

“Saw you’re hiring for an Implementation Specialist. I built a CRM workflow that cut onboarding time by 40%. Here’s a 2-min demo: [link]. Would love to talk about how I can do the same for your team.”

Track responses and follow up at least once.

End of Day 21:
You will have:

3 targeted roles that align with your skills.

2 new high-value skills under your belt.

A public proof-of-work asset.

50 hiring managers who’ve seen your work.




# Next.js SaaS Starter

This is a starter template for building a SaaS application using **Next.js** with support for authentication, Stripe integration for payments, and a dashboard for logged-in users.

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features
- EMAIL SENDING WITH RESEND: https://resend.com/onboarding
- Analytics implemented using Google Tag Manager with Mixpanel integration
- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) which connects to Stripe Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `STRIPE_SECRET_KEY`: Use your Stripe secret key for the production environment.
3. `STRIPE_WEBHOOK_SECRET`: Use the webhook secret from the production webhook you created in step 1.
4. `POSTGRES_URL`: Set this to your production database URL.
5. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev

// ===============================
// CareerPath AI – Prompt Pack (TypeScript)
// ===============================

/**
 * Install:
 *   npm i zod
 */

import { z } from "zod";

// ---------- 1) INPUT SCHEMA ----------
export const UserProfileSchema = z.object({
  current_role: z.string(),
  industry: z.string().optional(),
  years_experience: z.number().min(0).max(60),
  skills_current: z.array(z.string()).min(1),
  strengths: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  constraints: z
    .object({
      geo: z.string().optional(),
      visa: z.string().optional(),
      salary_target: z.number().optional(),
      timeline_months: z.number().optional(),
      hours_per_week_learning: z.number().optional(),
    })
    .optional()
    .default({}),
  values_priorities: z
    .object({
      salary: z.number().min(0).max(5).default(3),
      stability: z.number().min(0).max(5).default(3),
      remote: z.number().min(0).max(5).default(3),
      impact: z.number().min(0).max(5).default(3),
      speed_to_switch: z.number().min(0).max(5).default(3),
    })
    .optional()
    .default({
      salary: 3,
      stability: 3,
      remote: 3,
      impact: 3,
      speed_to_switch: 3,
    }),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ---------- 2) OUTPUT SCHEMA ----------
const SalarySchema = z.object({
  currency: z.string().default("USD"),
  p50: z.number().optional(),
  p90: z.number().optional(),
  note: z.string().optional(),
});

const MissingSkillSchema = z.object({
  skill: z.string(),
  why_it_matters: z.string(),
  estimated_learning_hours: z.number().int().min(1),
  learning_sequence_order: z.number().int().min(1),
  resources: z
    .array(
      z.object({
        type: z.enum(["course", "book", "yt", "project", "cert", "article", "doc"]),
        title: z.string(),
        provider: z.string().optional(),
        est_hours: z.number().optional(),
      })
    )
    .min(1),
});

const EntryPathSchema = z.object({
  time_to_break_in_months: z.number().int().min(0).max(60),
  starter_projects: z.array(z.string()).min(1),
  certs: z.array(z.string()).optional().default([]),
  proof_of_work_assets: z.array(z.string()).min(1),
});

const OutreachTemplatesSchema = z.object({
  cold_dm: z.string(),
  linkedin_about: z.string(),
  resume_headline: z.string(),
});

const ScoreBreakdownSchema = z.object({
  final: z.number().min(0).max(100),
  automation_risk: z.number().min(0).max(100),
  market_demand: z.number().min(0).max(100),
  transferability: z.number().min(0).max(100),
  salary_potential: z.number().min(0).max(100),
  time_to_break_in: z.number().min(0).max(100), // normalized, higher is better (faster)
  weights: z.object({
    market_demand: z.number(),
    de_risking_automation: z.number(),
    transferability: z.number(),
    salary_potential: z.number(),
    time_to_break_in: z.number(),
  }),
});

const PathSuggestionSchema = z.object({
  title: z.string(),
  short_pitch: z.string(),
  why_future_proof: z.string(),
  automation_risk: z.number().min(0).max(100), // lower is better
  market_demand: z.number().min(0).max(100),
  salary: SalarySchema,
  transferable_skills: z.array(z.string()).min(1),
  missing_skills: z.array(MissingSkillSchema).min(1),
  entry_path: EntryPathSchema,
  first_14_days: z.array(z.string()).min(7),
  outreach_templates: OutreachTemplatesSchema,
  score_breakdown: ScoreBreakdownSchema,
  evidence: z
    .array(
      z.object({
        claim: z.string(),
        rationale: z.string(),
      })
    )
    .min(1),
});

// ---------- METADATA SCHEMA ----------
const MetadataSchema = z.object({
  titles: z.array(z.string()).min(3).max(4),
  highlights: z.array(z.string()).min(3).max(4),
  best_path: z.string(), // career title with highest final score
  summary: z.string(), // 1-2 sentences summarizing all paths
  scores: z.array(
    z.object({
      title: z.string(),
      score: z.number().min(0).max(100),
    })
  ),
});

// ---------- CAREER PATH RESPONSE WITH METADATA ----------
export const CareerPathResponseSchema = z.object({
  meta: z.object({
    candidate_count: z.number().int().min(3).max(4),
    generated_at: z.string(),
    notes: z.string().optional(),
  }),
  metadata: MetadataSchema, // NEW quick preview block
  decision_matrix: z.array(
    z.object({
      title: z.string(),
      final_score: z.number().min(0).max(100),
      automation_risk: z.number().min(0).max(100),
      market_demand: z.number().min(0).max(100),
      transferability: z.number().min(0).max(100),
      salary_potential: z.number().min(0).max(100),
      time_to_break_in: z.number().min(0).max(100),
    })
  ),
  suggestions: z.array(
    z.object({
      title: z.string(),
      short_pitch: z.string(),
      why_future_proof: z.string(),
      automation_risk: z.number().min(0).max(100),
      market_demand: z.number().min(0).max(100),
      salary: z.object({
        currency: z.string().default("USD"),
        p50: z.number().optional(),
        p90: z.number().optional(),
        note: z.string().optional(),
      }),
      transferable_skills: z.array(z.string()).min(1),
      missing_skills: z.array(
        z.object({
          skill: z.string(),
          why_it_matters: z.string(),
          estimated_learning_hours: z.number().int().min(1),
          learning_sequence_order: z.number().int().min(1),
          resources: z
            .array(
              z.object({
                type: z.enum([
                  "course",
                  "book",
                  "yt",
                  "project",
                  "cert",
                  "article",
                  "doc",
                ]),
                title: z.string(),
                provider: z.string().optional(),
                est_hours: z.number().optional(),
              })
            )
            .min(1),
        })
      ),
      entry_path: z.object({
        time_to_break_in_months: z.number().int().min(0).max(60),
        starter_projects: z.array(z.string()).min(1),
        certs: z.array(z.string()).optional().default([]),
        proof_of_work_assets: z.array(z.string()).min(1),
      }),
      first_14_days: z.array(z.string()).min(7),
      outreach_templates: z.object({
        cold_dm: z.string(),
        linkedin_about: z.string(),
        resume_headline: z.string(),
      }),
      score_breakdown: z.object({
        final: z.number().min(0).max(100),
        automation_risk: z.number().min(0).max(100),
        market_demand: z.number().min(0).max(100),
        transferability: z.number().min(0).max(100),
        salary_potential: z.number().min(0).max(100),
        time_to_break_in: z.number().min(0).max(100),
        weights: z.object({
          market_demand: z.number(),
          de_risking_automation: z.number(),
          transferability: z.number(),
          salary_potential: z.number(),
          time_to_break_in: z.number(),
        }),
      }),
      evidence: z.array(
        z.object({
          claim: z.string(),
          rationale: z.string(),
        })
      ),
    })
  ).min(3).max(4),
  global_rationale: z.string(),
});

export type CareerPathResponse = z.infer<typeof CareerPathResponseSchema>;


// ---------- 3) SYSTEM PROMPT ----------
export const SYSTEM_PROMPT = `
You are CareerPath AI, a rigorous career strategist.
Your job: Given a user's background, propose 3–4 **lucrative, low-automation-risk** career paths that:
  - Leverage their existing skills (high transferability),
  - Are realistically reachable within their time & learning constraints,
  - Provide concrete, stepwise learning and proof-of-work plans,
  - Include outreach templates to accelerate hiring.

**Rules**
- Think step-by-step **internally**. Output **only valid JSON** for the provided schema.
- Do not propose roles with Automation Risk > 60 unless you justify why and show a resilient niche.
- Each suggestion must include: why it's future-proof, exact missing skills, learning hours, and a 14-day action plan.
- Always include a weighted decision matrix and explain the *global rationale* (still within JSON).
- Be specific, measurable, and realistic. No fluff.

**Scoring Weights (you must include in the output):**
  market_demand = 0.30
  de_risking_automation (100 - automation_risk) = 0.25
  transferability = 0.20
  salary_potential = 0.15
  time_to_break_in (normalized, higher = faster) = 0.10

**Normalize all sub-scores to 0–100.**

**Return strictly the JSON described by CareerPathResponseSchema.**
`;

// ---------- 4) USER PROMPT BUILDER ----------
export function buildUserPrompt(user: UserProfile) {
  return `
USER_PROFILE_JSON:
${JSON.stringify(user, null, 2)}
Return only JSON matching CareerPathResponseSchema.
`;
}

// ---------- 5) EXAMPLE USAGE (pseudo – adapt to your LLM client) ----------
/*
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runCareerPath(user: UserProfile) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(user) },
  ];

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.2,
  });

  const json = JSON.parse(resp.choices[0].message.content);
  const parsed = CareerPathResponseSchema.parse(json);
  return parsed;
}

(async () => {
  const user: UserProfile = {
    current_role: "Customer Support Specialist",
    industry: "SaaS",
    years_experience: 4,
    skills_current: ["Communication", "SQL basics", "Zendesk", "Zapier", "Notion"],
    strengths: ["Process design", "Empathy", "Documentation"],
    interests: ["Automation", "Data", "Operations"],
    constraints: { geo: "US", salary_target: 90000, timeline_months: 6, hours_per_week_learning: 10 },
    values_priorities: { salary: 4, stability: 4, remote: 5, impact: 3, speed_to_switch: 4 },
  };

  const result = await runCareerPath(user);
  console.log(JSON.stringify(result, null, 2));
})();
*/
