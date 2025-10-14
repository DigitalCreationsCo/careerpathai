import './landing.css'
import { ArrowRight, CheckCircle, CheckSquareIcon, SquareIcon, Star, Zap } from 'lucide-react';
import { Browser } from '@/components/browser';
import { copyright, dateJobsDisplaced, numJobsDisplaced } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';

export default async function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-hero text-foreground md:snap-none snap-y snap-mandatory md:overflow-hidden overflow-y-scroll md:h-auto h-screen scroll-smooth">
        {/* Hero Section */}
        <section className="bg-gradient-primary-glow relative min-h-screen flex items-center justify-center p-2 sm:px-6 lg:px-8 snap-start">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />

          <div className="relative z-10 max-w-[80%] mx-auto text-center space-y-6 animate-slide-up">
            
            <div className="space-y-4 md:pt-4">
              <div className="hidden md:inline-flex items-center px-4 py-2 text-warning mb-4 gap-2">
                <Logo size="md" />
                <p className="shiny-text font-semibold">{`AI is eliminating ${numJobsDisplaced} jobs by ${dateJobsDisplaced} — Are you prepared?`}</p>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-transparent bg-gradient-primary bg-clip-text">
                  AI-Proof Your Career
                </span>
                <br/>Before It's Too Late
              </h1>
              
              <p className="subtitle">
                Receive your personalized <span className='text-foreground font-semibold'>Career Path Report</span> revealing <span className='text-foreground font-semibold'>4&nbsp;high-paying, AI-resistant career paths</span> you can thrive in — using the skills you already have
              </p>
              <p className="text-sm text-muted-foreground">
                Join <span className="text-accent font-semibold">1,000+</span> future-proofing their careers in the AI economy
              </p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="subtext">Regular Price: $99</p>
                  <p className="text-lg lg:text-3xl font-bold text-success">Launch Price: $29 (Limited Time)</p>
                </div>
                
                <Link href="/sign-up">
                  <Button
                    variant="cta"
                    size="xl"
                    className="text-background items-center"
                  >
                    Get My Career Path Report – $29
                    {/* <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} /> */}
                  </Button>
                </Link>
              </div>
              
              {/* <p className="text-sm text-muted-foreground">
                Delivered within 24-48 hours • No refunds on digital products
              </p> */}
            </div>
          </div>
        </section>

        {/* Product Spec Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background snap-start">
          <div className="md:max-w-2xl mx-auto">
            <div className="text-center md:mb-16">
              <h2 className="text-4xl max-w-[400px] md:max-w-full text-center place-self-center font-bold mb-4">
                <span className="text-transparent bg-gradient-accent bg-clip-text">Preview Your Career Path Report</span>
              </h2>
              <p className="subtitle">
                Here's what your personalized <strong>Career Path Report</strong> includes:
              </p>
              <ul className="max-w-100 px-4 py-4 space-y-4 justify-self-center md:w-100 text-left md:text-center">
                <li>
                  <span className='text-2xl'>🎯</span> <span className='font-semibold'>Strategy Plan</span>
                  <br/>
                  <p className="text-muted-foreground text-lg">
                    Your step-by-step roadmap to land a future-proof role.
                  </p>
                </li>
                <li>
                  <span className='text-2xl'>📚</span> <span className="font-semibold">Skills Gap Analysis</span>
                  <br/>
                  <p className="text-muted-foreground text-lg">
                    Pinpoint exactly what to learn (and what you can skip).
                  </p>
                </li>
                <li>
                  <span className='text-2xl'>🚀</span> <span className="font-semibold">30-Day Sprint</span>
                  <br/>
                  <p className="text-muted-foreground text-lg">
                    A daily action plan to accelerate your transition.
                  </p>
                </li>
                <li>
                  <span className='text-2xl'>💼</span> <span className="font-semibold">Communication Packet</span>
                  <br/>
                  <p className="text-muted-foreground text-lg">
                    Ready-to-use outreach templates and salary scripts to help you land offers faster.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Product Demo Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20 snap-start">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center text-4xl font-bold mb-8">
              <span className="text-transparent bg-gradient-accent bg-clip-text">Example Report: <span className="italic">Marketing Director → AI-Proof Career</span></span>
            </h2>
            {/* Demo Report */}
            <Browser className="md:w-[90%] place-self-center">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg text-primary mb-2"><span className='text-2xl'>🎯 </span>Career Path #1</h3>
                  <p className="text-muted-foreground">Revenue Operations Director</p>
                </div>

                <div>
                  <div className="grid md:grid-cols-2 gap-8 space-y-2">
                    <div className="rounded-lg">
                      <div className="space-y-1 py-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Salary Range:</span>
                          <span className="font-medium text-success">$75K - $120K</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Automation Risk Score:</span>
                          <span className="font-medium text-success">Low (15%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transferability Score:</span>
                          <span className="font-medium text-primary">85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time to Pivot:</span>
                          <span className="font-medium text-primary">3–4 months</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground">
                      <div className="rounded-lg space-y-4">
                      <h4 className="text-accent"><span className='text-xl'>📚 </span>Skills Gap Analysis</h4>
                        <ul className="text-sm space-y-1">
                          <li className="text-sm flex items-center">
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
                <div className="space-y-2">
                  <p className="px-4 text-muted-foreground">
                    Career Path Report includes:
                  </p>
                  <ul className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2'>
                    <li>
                      <p className="text-sm text-muted-foreground">30-Day Sprint: </p>
                    </li>
                    <li>
                      <p className="text-sm text-muted-foreground">Week 1: Complete Salesforce training, update LinkedIn headline...</p>
                    </li>
                    <li>
                      <p className="text-sm text-muted-foreground">Outreach Templates</p>
                    </li>
                    <li>
                      <p className="text-sm text-muted-foreground">Salary Negotiation Scripts</p>
                    </li>
                    <li>
                      <p className="text-sm text-muted-foreground">and more actionable tools</p>
                    </li>
                  </ul>
                </div>
              </div>
            </Browser>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4 w-[95%] place-self-center">
                This could be one of 4 high-paying, AI-resistant career paths you'll discover in your complete Career Path Report.
              </p>
              <Link href="/sign-up">
                <Button 
                  variant="cta" 
                  size="lg"
                  className="text-background"
                >
                  Unlock All 4 Career Paths – Get My Complete Report for $29
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-card snap-start">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold text-transparent bg-gradient-primary bg-clip-text">
              Join 500+ Professionals Who've Already AI-Proofed Their Careers
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="max-w-md mx-auto bg-muted/20 rounded-xl p-6 border border-border">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                “The Career Path Report gave me total clarity. The 30-Day Sprint got me moving immediately, and now I'm earning $95K in cybersecurity.”
                </p>
                <p className="font-semibold">Sarah Chen, Cybersecurity Analyst</p>
              </div>
              
              <div className="max-w-md mx-auto bg-muted/20 rounded-xl p-6 border border-border">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The Skills Gap Analysis was spot-on. I went from technical support to RevOps in 4 months using the Career Path Report!"
                </p>
                <p className="font-semibold">Marcus Rodriguez, Revenue Operations Manager</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background snap-start">
          <div className="flex flex-col items-center justify-center mx-auto text-center gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-warning">
                <span className="text-2xl">⚠️ </span>{`${numJobsDisplaced} Jobs Will Be Displaced by ${dateJobsDisplaced}`}
              </h2>
              <p className="subtitle">
                Don't wait to AI-proof your career. 
                <br/>Your future role is already waiting — get your personalized Career Path Report today.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="subtext">Regular Price: $99</p>
                <p className="text-lg lg:text-3xl font-bold text-success">Launch Price: $29 (Limited Time)</p>
              </div>

              <Link href="/sign-up">
                <Button 
                  variant="cta" 
                  size="xl"
                  className='text-background'
                >
                  🔓 Get My Career Path Report – $29
                </Button>
              </Link>

              <div className="text-sm text-red-400 font-medium">
                Final sale • No refunds • Instant digital delivery
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 snap-start">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            <p>{copyright}</p>
          </div>
        </footer>
    </main>
  );
}
