import './landing.css'
import { ArrowRight, CheckCircle, Star, Zap } from 'lucide-react';
import { Browser } from '@/components/browser';
import { copyright, dateJobsDisplaced, numJobsDisplaced } from '@/lib/utils';
import { Button } from '@/components/ui/button/button';
import Link from 'next/link';

export default async function WaitlistLandingPage() {
  return (
    <main>
      <div className="min-h-screen bg-gradient-hero text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="bg-gradient-primary-glow relative min-h-screen flex items-start justify-center p-2 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />

          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-12 animate-slide-up">
            
            <div className="space-y-4 md:pt-4">
              <div className="inline-flex items-center px-4 py-2 text-warning text-sm md:text-md font-medium mb-4">
                <Zap className="mr-2" size={16} />
                <p className="shiny-text">{`AI is eliminating ${numJobsDisplaced} jobs by ${dateJobsDisplaced} — Are you prepared?`}</p>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-transparent bg-gradient-primary bg-clip-text">
                  AI-Proof Your Career
                </span>
                <br />Before It's Too Late
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg lg:max-w-2xl mx-auto leading-snug">
                Get your personalized <span className='text-foreground font-semibold'>Career Path Report</span> revealing <span className='text-foreground font-semibold'>4 high-paying, AI-resistant career paths</span> you can pivot to using your <span className="text-foreground font-semibold">existing skills</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Join <span className="text-accent font-semibold">1,000+</span> professionals pivoting during the AI wave
              </p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-through">Regular Price: $99</p>
                  <p className="text-3xl md:text-4xl font-bold text-success">Launch Price: Only $29</p>
                  <p className="text-sm text-green-400 font-medium">+ FREE Resume Template Library ($47 value)</p>
                </div>
                
                <Link href="/sign-up">
                  <Button 
                    variant="cta" 
                    size="xl"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold group w-full md:w-auto"
                  >
                    Get My Career Path Report - $29
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Delivered within 24-48 hours • No refunds on digital products
              </p>
            </div>
          </div>
        </section>

        {/* Product Demo Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                See What You'll Get: {' '}
                <span className="text-transparent bg-gradient-accent bg-clip-text">Your Career Path Report</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Here's a real example of what your personalized Career Path Report includes:
                <br />
                career strategy, Skills Gap Analysis, and your 14-Day Action Sprint.
              </p>
            </div>

            {/* Demo Report */}
            <Browser>
              <div className="bg-gradient-card rounded-2xl p-8 max-w-4xl mx-auto space-y-8">
                <div className="border-b border-border pb-4">
                  <h3 className="text-2xl font-bold text-primary mb-2">Career Path Report</h3>
                  <p className="text-muted-foreground">For: Marketing Coordinator → AI-Resistant Career Paths</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-accent items-center">🎯 Career Path #1</h4>
                    <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                      <h5 className="font-semibold text-primary">Revenue Operations Specialist</h5>
                      <div className="space-y-1 text-sm">
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
                          <span className="font-medium">3–4 months</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-accent">📚 Skills Gap Analysis</h4>
                    <div className="bg-muted/20 rounded-lg p-4">
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 text-success" size={16} />
                          Salesforce Admin Cert (40 hrs)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 text-success" size={16} />
                          HubSpot Revenue Ops (20 hrs)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 text-success" size={16} />
                          SQL for Analytics (30 hrs)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 text-blue-400" size={16} />
                          Career Pivot Toolkit included
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-bold text-blue-400 mb-2">14-Day Action Sprint</h4>
                  <p className="text-sm text-muted-foreground">Week 1: Complete Salesforce Trailhead basics, update LinkedIn headline...</p>
                  <p className="text-xs text-blue-300 mt-2">+ Outreach Templates, Salary Negotiation Scripts, and more!</p>
                </div>
              </div>
            </Browser>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">This is just 1 of 4 career paths in your complete Career Path Report</p>
              <Link href="/sign-up">
                <Button 
                  variant="cta" 
                  size="lg"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold"
                >
                  Get My Complete Report - $29
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-card">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Join 500+ Professionals Who've Already Pivoted
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-muted/20 rounded-xl p-6 border border-border">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The Career Path Report was incredibly detailed. The 14-Day Action Sprint got me moving immediately, and now I'm earning $95K in cybersecurity!"
                </p>
                <p className="font-semibold">Sarah Chen, Cybersecurity Analyst</p>
              </div>
              
              <div className="bg-muted/20 rounded-xl p-6 border border-border">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The Skills Gap Analysis in my Career Path Report was spot-on. Transitioned from support to RevOps in 4 months using the Career Pivot Toolkit!"
                </p>
                <p className="font-semibold">Marcus Rodriguez, Revenue Operations Manager</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-warning">
                {`${numJobsDisplaced} Jobs Will Be Displaced by ${dateJobsDisplaced}`}
              </h2>
              <p className="text-xl text-muted-foreground">
                Don't wait to AI-proof your career. Get your Career Path Report today.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground line-through">Regular Price: $99</p>
                <p className="text-4xl font-bold text-success">Launch Price: $29</p>
                <p className="text-green-400 font-medium">+ FREE Resume Template Library</p>
              </div>

              <Link href="/sign-up">
                <Button 
                  variant="cta" 
                  size="xl"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold"
                >
                  Get Started Today - $29
                </Button>
              </Link>

              <div className="text-xs text-red-400 font-medium">
                Final sale • No refunds • Secure payment via Stripe
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            <p>{copyright}</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
