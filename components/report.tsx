"use client"
import React, { ReactElement } from 'react';
import { Report } from '@/lib/db/schema';


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
    <span className='text-foreground text-right'>{value}</span>
  </div>
);

/** =========================
 *  Main Component
 *  ========================= */
export default function CareerPathReport ({
  data,
}: {data: Report}): ReactElement<{ data: Report }> {
  const { metadata, decisionMatrix, suggestions, globalRationale } =
    data;

  return (
    <div className='min-h-screen bg-white text-foreground p-6 md:p-12 print:p-4'>
      <style>{printStyles}</style>

      {/* Header */}
      <header className='mb-8 flex items-start justify-between print:mb-4'>
        <div>
          <h1 className='text-3xl font-bold'>
            CareerPath AI — Low-Risk, High-Upside Paths
          </h1>
          <p className='text-gray-500'>
            Generated: {fmtDate(metadata.generated_at)} · Candidates:{' '}
            {metadata.candidate_count}
          </p>
        </div>
        <button
          // onClick={() => window.print()}
          className='hidden md:inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 print:hidden'
        >
          Print / Save PDF
        </button>
      </header>

      {/* Meta */}
      <Section title='Meta'>
        <div className='grid md:grid-cols-3 gap-4'>
          <KeyValue label='Candidate Count' value={metadata.candidate_count} />
          <KeyValue label='Generated At' value={fmtDate(metadata.generated_at)} />
          {metadata.notes && <KeyValue label='Notes' value={metadata.notes} />}
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
              {decisionMatrix.map(row => (
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
        <p>{globalRationale}</p>
      </Section>

      <footer className='text-sm text-gray-400 mt-16 print:mt-4'>
        Generated by CareerPath AI
      </footer>
    </div>
  );
};

/** Simple table cell helpers */
const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className='text-left px-3 py-2 text-sm font-semibold uppercase tracking-wide text-gray-600'>
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
