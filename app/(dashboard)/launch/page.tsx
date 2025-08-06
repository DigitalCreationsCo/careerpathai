import '../landing.css'
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, TrendingUp, Shield, Target, Clock, Users, CheckCircle, CreditCard, Database } from 'lucide-react';
import { FeatureCard } from '@/components/feature-card';
import { StepCard } from '@/components/step-card';
import { CountdownTimer } from '@/components/countdown-timer';
import { WaitlistEmailCapture } from '@/components/waitlist-email-capture';
import Link from 'next/link';
import { daysToLaunch, start } from '@/lib/launch-data';

export default function LandingPage() {
  return (
    <main>
      <div className="min-h-screen bg-gradient-hero text-foreground overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
          // style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Your Career May Not{' '}
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                Survive the AI Revolution
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              CareerPath AI analyzes your experience, skills, and goals to uncover high-paying, AI-resistant careers tailored to you.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <Link href="/sign-up">
              <Button variant="hero" size="xl" className="cursor-pointer group">
                Find My Future-Proof Career
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Button>
            </Link>
            
            <p className="text-sm text-muted-foreground">
              Join <span className="text-accent font-semibold">1,000+</span> professionals already future-proofing their careers
            </p>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Discover Your <span className="text-transparent bg-gradient-accent bg-clip-text">AI-Proof Future</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized career paths that leverage your existing skills while preparing you for tomorrow's job market.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target size={48} />}
              title="3-4 Lucrative Career Paths"
              description="Discover high-paying, AI-resistant careers that build on your current skills and experience."
            />
            <FeatureCard
              icon={<Brain size={48} />}
              title="Skill Gap Analysis"
              description="Get a detailed plan with estimated hours and resources to bridge any skill gaps efficiently."
            />
            <FeatureCard
              icon={<Shield size={48} />}
              title="Future-Proof Guarantee"
              description="See which careers will thrive in the AI era and which ones will become obsolete."
            />
          </div>
        </div>
      </section>

      {/* Urgency Block */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-warning/10 to-destructive/10 border-y border-warning/20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-warning">
              85M Jobs Will Be Displaced by 2025
            </h2>
            <p className="text-xl text-foreground">
              Don't wait to future-proof your career. AI won't wait — neither should you.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-lg font-semibold text-accent">Early Access: Only 100 Spots This Month</p>
            <CountdownTimer start={start} remaining={daysToLaunch} />
            <p className="text-sm text-muted-foreground">
              First 500 users get lifetime discount
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Get your personalized career roadmap in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              title="Answer 4 Quick Questions"
              description="Tell us about your current skills, experience, and career goals in just 2 minutes."
            />
            <StepCard
              step={2}
              title="AI Finds Your Best Paths"
              description="Our AI analyzes thousands of career trajectories to find your optimal future-proof matches."
            />
            <StepCard
              step={3}
              title="Get Your Roadmap"
              description="Receive a personalized career roadmap with learning plans and pivot strategies."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-card">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* A headline */}
          {/* <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Trusted by Career-Forward Professionals
          </h2> */}
          
          {/* B headline */}
          {/* <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Join 100+ Professionals Who've Already Pivoted
          </h2> */}
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-muted/20 rounded-xl p-6 border border-border">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="text-success mr-1" size={16} strokeWidth={3} />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "CareerPath AI helped me transition from marketing to AI governance in just 3 months. The roadmap was spot-on!"
              </p>
              <p className="font-semibold">— Sarah Chen, AI Compliance Specialist</p>
            </div>
            
            <div className="bg-muted/20 rounded-xl p-6 border border-border">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="text-success mr-1" size={16} strokeWidth={3} />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Finally, a clear path forward! I went from operations to RevOps and doubled my salary."
              </p>
              <p className="font-semibold">— Marcus Rodriguez, Revenue Operations Manager</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="mr-2 text-accent" size={16} />
              1,000+ Users
            </div>
            <div className="flex items-center">
              <TrendingUp className="mr-2 text-success" size={16} />
              94% Success Rate
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 text-primary" size={16} />
              3 Month Avg. Pivot
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Future-Proof Your Career?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join the early access list and be among the first to secure your AI-resistant career path.
            </p>
          </div>

          <WaitlistEmailCapture />

          <div className="space-y-4">
            <Button variant="warning" size="lg">
              Reserve My Career Map – $29 (Limited Time)
            </Button>
            <p className="text-sm text-muted-foreground">
              {/* 30-day money-back guarantee • Secure payment via Stripe */}
              Secure payment via Stripe
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 CareerPath AI. All rights reserved. • Upgrade Your Career for the AI Age</p>
        </div>
      </footer>
    </div>
    </main>
  );
}
