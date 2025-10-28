import './landing.css'
import { CheckSquareIcon, Star } from 'lucide-react';
import { Browser } from '@/components/browser';
import { copyright, dateJobsDisplaced, numJobsDisplaced } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';

export default async function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-hero text-foreground md:overflow-hidden overflow-y-scroll md:h-auto h-screen scroll-smooth">
      {/* Hero Section */}
      <section className="bg-gradient-primary-glow relative min-h-screen flex md:items-center justify-center p-2 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
        <div className="relative z-10 max-w-md sm:max-w-[80%] mx-auto text-center space-y-8 animate-slide-up mt-20 md:mt-0">
          <div className="space-y-4 md:pt-4">
            <div className="hidden md:inline-flex items-center px-4 py-2 text-warning mb-0 gap-2">
              <Logo size="md" />
              <p className="shiny-text text-lg">{`AI is eliminating over ${numJobsDisplaced} jobs by ${dateJobsDisplaced} — Are you prepared?`}</p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl leading-tight tracking-tight">
              <span className="text-transparent bg-gradient-primary bg-clip-text font-bold lg:font-normal">
                AI-Proof Your Career
              </span>
              <br />
              <span className="text-warning block font-bold lg:font-normal">
                Before It’s Too Late
              </span>
            </h1>
            <p className="subtitle  text-muted-foreground sm:text-lg max-w-2xl mx-auto">
              Get your <span className="text-foreground">personalized Career Path Report</span>—discover <span className='text-foreground'>4 high-paying, AI-resistant roles</span> you can thrive in using skills you already have.<br /><br />
              <span className="subtext">
                Join <span className="text-accent">1,000+ professionals</span> future-proofing their careers in the AI economy.
              </span>
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground line-through whitespace-pre"> Regular: $99 </p>
              <p className="heading text-success font-[Outfit]">Launch Special: $29 <span className="subtext text-muted-foreground">(Limited Time)</span></p>
            </div>
            <Link href="/sign-up" legacyBehavior>
              <Button
                variant="cta"
                size="xl"
                className="text-background items-center w-full max-w-xs"
              >
                Get My Career Path Report – $29
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background/80 to-muted/10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div>
            <h2 className="heading mb-3">
              <span className="text-transparent bg-gradient-warning bg-clip-text">
                Why Upskilling Matters Now
              </span>
            </h2>
            <p className="subtitle  sm:text-lg text-muted-foreground">
              The world of work is changing faster than ever. AI and automation are already making entire categories of jobs obsolete—<span className="text-foreground">waiting means falling behind</span>. Upskilling today is your best defense against job displacement, and your smartest move for a secure, fulfilling future.
            </p>
          </div>
          <div className="mt-2">
            <h3 className="heading text-xl sm:text-2xl mb-2">
              How Your Career Path Report Is <span className="text-accent">Personalized</span>
            </h3>
            <p className="subtitle  sm:text-lg text-muted-foreground">
              Your report is unique—just like your career journey. We analyze your <span className="text-foreground">location, current skill level, existing skills, desired salary</span>, and more to create a customized roadmap.
            </p>
            <ul className="grid gap-3 md:grid-cols-2 max-w-2xl mx-auto mt-5 text-left text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-lg mt-1">🌎</span>
                <div>
                  <span className="text-foreground">Your Geography</span>
                  <div>Find roles and industries in demand where you live.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg mt-1">🎓</span>
                <div>
                  <span className="text-foreground">Skill Level</span>
                  <div>Recommendations align with your actual experience (no unrealistic pivots).</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg mt-1">🛠️</span>
                <div>
                  <span className="text-foreground">Existing Skills</span>
                  <div>We build on what you already know for a faster, smoother transition.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg mt-1">💰</span>
                <div>
                  <span className="text-foreground">Desired Salary</span>
                  <div>Target career paths that match your compensation goals.</div>
                </div>
              </li>
              <li className="flex items-start gap-3 md:col-span-2">
                <span className="text-lg mt-1">⚡</span>
                <div>
                  <span className="text-foreground">And More</span>
                  <div>Your aspirations, strengths, and even your timeline shape your report—so it fits <span>you</span>, not the crowd.</div>
                </div>
              </li>
            </ul>
            <div className="mt-8">
              <Link href="/sign-up" legacyBehavior>
                <Button
                  variant="cta"
                  size="xl"
                  className="text-background w-full max-w-xs mx-auto"
                >
                  Start My Personalized Career Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background/80 to-muted/10">
        <div className="max-w-2xl mx-auto space-y-10 flex flex-col items-center">
          {/* Headline & Motivation */}
          <div className="w-full text-center space-y-3">
            <h2 className="heading mb-1">
              <span className="text-transparent bg-gradient-warning bg-clip-text">
                Secure Your Future Skills
              </span>
            </h2>
            <p className="subtitle text-md sm:text-lg text-muted-foreground">
              AI is changing work rapidly.<br />
              <span className="text-foreground">Upskill now to stay ahead.</span>
            </p>
          </div>
          {/* 2-Column Personalization & Feature Grid */}
          <div className="w-full grid sm:grid-cols-2 gap-6 text-left">
            <div className="bg-background/50 p-6 rounded-lg border border-border flex flex-col items-start space-y-4">
              <h3 className="text-foreground text-lg flex items-center gap-2">
                <span className="text-xl">✨</span>Personalized for You
              </h3>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li className="flex gap-2 items-start">
                  <span className="text-lg">🌎</span>
                  <span>
                    <span className="text-foreground">Location</span>: See roles in your region.
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-lg">🎓</span>
                  <span>
                    <span className="text-foreground">Skill Level</span>: Roles fit your experience.
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-lg">🛠️</span>
                  <span>
                    <span className="text-foreground">Existing Skills</span>: Build on what you know.
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-lg">💰</span>
                  <span>
                    <span className="text-foreground">Salary Goals</span>: Target your ambitions.
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-background/50 p-6 rounded-lg border border-border flex flex-col items-start space-y-4">
              <h3 className="text-foreground text-lg flex items-center gap-2">
                <span className="text-xl">📈</span>Why Upskill Now?
              </h3>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li className="flex gap-2 items-start">
                  <span className="text-lg">⚡</span>
                  <span>
                    <span className="text-foreground">Rise Above Automation</span>: Avoid jobs at risk.
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-lg">🚀</span>
                  <span>
                    <span className="text-foreground">Accelerate Your Pivot</span>: Get a clear action plan.
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-lg">🔒</span>
                  <span>
                    <span className="text-foreground">Skill Security</span>: Upgrade with confidence.
                  </span>
                </li>
              </ul>
            </div>
          </div>
          {/* CTA */}
          <div className="w-full flex justify-center pt-4">
            <Link href="/sign-up" legacyBehavior>
              <Button
                variant="cta"
                size="xl"
                className="text-background w-full max-w-xs mx-auto"
              >
                Start My Personalized Report
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Features / What's Included */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="md:max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="heading mb-2">
              <span className="text-transparent bg-gradient-accent bg-clip-text">
                What's Inside
              </span>
            </h2>
            <p className="subtitle mb-4 sm:text-lg">
              Every personalized Career Path Report includes:
            </p>
          </div>
          <ul className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto text-left">
            <li className="p-4 rounded-lg hover:bg-accent/10 transition">
              <span className='text-2xl'>🎯</span>{' '}
              <span>Custom Strategy Plan</span>
              <p className="text-muted-foreground mt-1 ml-1">
                A step-by-step roadmap to pivot into resilient roles that fit your background.
              </p>
            </li>
            <li className="p-4 rounded-lg hover:bg-accent/10 transition">
              <span className='text-2xl'>📚</span>{' '}
              <span>Skills Gap Analysis</span>
              <p className="text-muted-foreground  mt-1 ml-1">
                See exactly which skills to upgrade (and which to skip)—no wasted time or money.
              </p>
            </li>
            <li className="p-4 rounded-lg hover:bg-accent/10 transition">
              <span className='text-2xl'>🚀</span>{' '}
              <span>30-Day Sprint</span>
              <p className="text-muted-foreground  mt-1 ml-1">
                Compact, daily action plan for rapid momentum—start moving day one.
              </p>
            </li>
            <li className="p-4 rounded-lg hover:bg-accent/10 transition">
              <span className='text-2xl'>💼</span>{' '}
              <span>Offer-Getting Scripts</span>
              <p className="text-muted-foreground  mt-1 ml-1">
                Outreach templates and salary scripts designed to help land interviews and increase offers.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Example Report */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading mb-6">
            <span className="text-transparent bg-gradient-accent bg-clip-text">
            Preview: <span className="italic">Marketing Director → AI-Ready Career</span>
            </span>
          </h2>
          {/* Demo Report */}
          <Browser className="lg:w-5xl mx-auto">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg text-primary mb-2 flex items-center gap-2">
                  <span className='text-2xl'>🎯</span> AI-Resistant Path #1
                </h3>
                <p className="text-muted-foreground ">Revenue Operations Director</p>
              </div>

              <div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="rounded-lg space-y-1 py-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Salary Range:</span>
                      <span className="text-success">$75K - $120K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Automation Risk:</span>
                      <span className="text-success">Low (15%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transferability:</span>
                      <span className="text-primary">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Pivot Time:</span>
                      <span className="text-primary">3–4 months</span>
                    </div>
                  </div>

                  <div className="text-muted-foreground">
                    <div className="rounded-lg space-y-3">
                      <h4 className="text-accent mb-1">
                        <span className='text-xl'>📚</span> Skills Gap Analysis
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center">
                          <CheckSquareIcon className="mr-2 text-success" size={16} />
                          Salesforce Admin Cert (40 hrs)
                        </li>
                        <li className="flex items-center">
                          <CheckSquareIcon className="mr-2 text-success" size={16} />
                          HubSpot Revenue Ops (20 hrs)
                        </li>
                        <li className="flex items-center">
                          <CheckSquareIcon className="mr-2 text-success" size={16} />
                          SQL for Analytics (30 hrs)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="px-4 text-muted-foreground text-sm mb-2">
                  Your custom plan includes:
                </p>
                <ul className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
                  <li>
                    <span className="text-muted-foreground">- 30-Day Sprint:</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground">- Week 1: Complete Salesforce training, Update LinkedIn, Reach out to hiring managers...)</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground">- Outreach templates</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground">- Salary negotiation scripts</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground">- More practical, actionable tools</span>
                  </li>
                </ul>
              </div>
            </div>
          </Browser>
          <div className="text-center mt-8 mb-4">
            <p className="text-muted-foreground my-8 w-full max-w-lg mx-auto">
            Discover <span className="text-accent">4 high-paying, AI-resistant career paths</span> tailored to you.
            </p>
            <Link href="/sign-up" legacyBehavior>
              <Button
                variant="cta"
                size="xl"
                className="mx-auto max-w-md text-background whitespace-normal break-words"
              >
                Unlock All 4 Career Paths – Get My Complete Report for $29
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof (Testimonials) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-card">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="heading text-transparent bg-gradient-primary bg-clip-text">
            Join 1,000+ Professionals Who've Already AI-Proofed Their Careers
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="max-w-md mx-auto bg-muted/30 rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">
              “The career path report gave me total clarity, and got me moving immediately. Today I'm earning $95K in cybersecurity.”
              </p>
              <p>Sarah Chen<br /><span className="text-sm text-muted-foreground">Cybersecurity Analyst</span></p>
            </div>

            <div className="max-w-md mx-auto bg-muted/30 rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">
                “The skills gap analysis was spot-on.  I went from technical support to a RevOps role in just 4 months using the report.”
              </p>
              <p>Marcus Rodriguez<br /><span className="text-sm text-muted-foreground">Revenue Operations Manager</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="flex flex-col items-center justify-center mx-auto text-center gap-8">
          <div className="space-y-3">
            <h2 className="heading text-warning text-2xl sm:text-3xl whitespace-pre-line font-semibold">⚠️ {numJobsDisplaced} jobs will be displaced by {dateJobsDisplaced}
            </h2>
            <p className="subtitle max-w-xs sm:max-w-md text-muted-foreground">
            Don't wait to AI-proof your career. <br/>
            Your future role is already waiting — get your personalized Career Path Report today.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="space-y-2">
              <p className="text-muted-foreground line-through whitespace-pre"> Regular: $99 </p>
              <p className="heading text-success font-[Outfit]">Launch Special: $29 <span className="subtext text-muted-foreground">(Limited Time)</span></p>
            </div>
            <Link href="/sign-up" legacyBehavior>
              <Button
                variant="cta"
                size="xl"
                className="text-background items-center w-full max-w-xs"
              >
                Get My Career Path Report – $29
              </Button>
            </Link>
            <div className="text-xs text-red-400 mt-2">
              Instant digital access. All sales are final.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-xs text-muted-foreground">
          <p>{copyright}</p>
        </div>
      </footer>
    </main>
  );
}
