import '../landing.css'
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, TrendingUp, Shield, Target, Clock, Users, CheckCircle, Star, Download, FileText, Zap, AlertCircle, Award, Eye } from 'lucide-react';
import { Terminal } from '../../../components/terminal';
import { FeatureCard } from '@/components/feature-card';
import { StepCard } from '@/components/step-card';
import { CountdownTimer } from '@/components/countdown-timer';
import { WaitlistEmailCapture } from '@/components/waitlist-email-capture';
import Link from 'next/link';
import { getReportsCount } from '@/lib/db/queries/report';
import { Browser } from '../../../components/browser';
import { daysToLaunch, start } from '@/lib/launch-data';

export default async function EarlyAccessLandingPage() {
    const reservedSpots = await getReportsCount()
    const spotsRemaining = 100 - reservedSpots;
    return (
        <main>
        <div className="min-h-screen bg-gradient-hero text-foreground overflow-hidden">
            {/* Mobile Urgency Bar */}
        <div className="bg-gradient-warning text-white pt-4 pb-3 px-4 text-center text-sm font-medium">
        <div className="flex items-center justify-center space-x-2 animate-glow-pulse">
        <AlertCircle size={16} />
        <span className="md:hidden">🔥 Early Access Discount: • {daysToLaunch*24}h remaining</span>
        <span className="hidden md:inline">Early Access Discount: {daysToLaunch*24} hours left • {spotsRemaining} spots remaining</span>
        </div>
        </div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center p-2 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-12 animate-slide-up">
        
        {/* Founder Credibility */}
        {/* <div className="inline-flex items-center bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-400 text-sm font-medium">
            <Award className="mr-2" size={16} />
            Built by ex-Google AI researcher • 500+ successful career pivots
        </div> */}

        <div className="space-y-4 md:pt-4">
            <div className="inline-flex items-center px-4 py-2 text-warning text-sm md:text-md font-medium mb-4">
            <Zap className="mr-2" size={16} />
            AI is eliminating 85M jobs by 2025 — Are you prepared?
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight ">
            <span className='md:text-5xl lg:text-7xl'>
            <span className="text-transparent bg-gradient-primary bg-clip-text">
                AI-Proof Your Career
            </span>
            <br />Before It's Too Late
            </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg lg:max-w-2xl mx-auto leading-snug">
            Get your personalized Career Transition Report revealing 3-4 high-paying, AI-resistant career paths you can pivot to using your existing skills.
            </p>
            <p className="text-sm text-muted-foreground">
                Join <span className="text-accent font-semibold">1,000+</span> professionals already AI-proofing their careers
            </p>
        </div>

        <div className="flex flex-col items-center space-y-6">
            <WaitlistEmailCapture
            title="Get Your Career Transition Report + 21-Day Action Sprint"
            emailPlaceholder="Enter your email for early access"
            buttonText="Get My Career Transition Report - $29"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground max-w-md">
            <div className="flex items-center justify-center md:justify-start">
                <AlertCircle className="mr-1 text-red-400" size={14} />
                <span className="text-red-400">No refunds</span>
            </div>
            <div className="flex items-center justify-center">
                <Clock className="mr-1 text-blue-400" size={14} />
                24-48h delivery
            </div>
            <div className="flex items-center justify-center md:justify-end">
                <CheckCircle className="mr-1 text-success" size={14} />
                Secure payment
            </div>
            </div>
        </div>

        <div className="flex flex-col items-center space-y-6">
            <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-through">Regular Price: $99</p>
            <p className="text-3xl md:text-4xl font-bold text-warning">Early Access: $29</p>
            <p className="text-sm text-success font-medium">+ FREE Resume Template Library ($47 value)</p>
            </div>

            {/* Bonus Incentive */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4 max-w-md">
            <div className="flex items-center justify-center mb-2">
                <Eye className="mr-2 text-success" size={20} />
                <span className="text-success font-bold">PREVIEW SAMPLE</span>
            </div>
            <p className="text-sm text-center">Get a preview sample of 1 career path before payment to build your confidence!</p>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto space-y-3 bg-muted/10 p-4 rounded-xl border border-warning/20">
            <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Early Access Reserved</span>
            <span className="text-warning font-bold">{reservedSpots}/100</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-3">
            <div 
                className="bg-gradient-warning h-3 rounded-full transition-all duration-1000 animate-pulse" 
                style={{ width: `${reservedSpots}%` }}
            />
            </div>
            <p className="text-xs text-warning font-medium">⚡ Filling fast • {spotsRemaining} spots remaining</p>
        </div>

        <CountdownTimer start={start} remaining={daysToLaunch} />
        </div>
        </section>

        {/* Product Demo Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See What You'll Get: {' '}
            <br className="md:hidden" />
            <span className="text-transparent bg-gradient-accent bg-clip-text">Career Transition Report</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Here's a real example of what your personalized Career Transition Report looks like. Define your career strategy → skills gap analysis → 21-Day Action Sprint.
            </p>
        </div>

        {/* Demo Report */}
        <Browser>
        <div className="bg-gradient-card rounded-2xl p-8 max-w-4xl mx-auto space-y-8">
            <div className="border-b border-border pb-6">
            <h3 className="text-2xl font-bold text-primary mb-2">Career Transition Report</h3>
            <p className="text-muted-foreground">For: Marketing Coordinator → AI-Resistant Career Paths</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <h4 className="text-lg font-bold text-accent">🎯 Career Path Recommendation #1</h4>
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
                    <span className="font-medium">3-4 months</span>
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
            <h4 className="font-bold text-blue-400 mb-2">21-Day Action Sprint</h4>
            <p className="text-sm text-muted-foreground">Week 1: Complete Salesforce Trailhead basics, update LinkedIn headline...</p>
            <p className="text-xs text-blue-300 mt-2">+ Outreach Templates, Salary Negotiation Scripts, and more!</p>
            </div>
        </div>
        </Browser>

        <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">This is just 1 of 3-4 career paths in your complete Career Transition Report</p>
            <Button 
            variant="warning" 
            size="lg"
            >
            Get My Career Transition Report - $29
            </Button>
        </div>
        </div>
        </section>

        {/* Social Proof - Early Access Focused */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-card">
        <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-primary">
            Trusted by Career-Forward Professionals
        </h2>
        
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-card rounded-xl p-6 border border-border">
            <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                ))}
            </div>
            <p className="text-muted-foreground mb-4">
                "The Career Transition Report was incredibly detailed. The 21-Day Action Sprint got me moving immediately, and now I'm earning $95K in cybersecurity!"
            </p>
            <p className="font-semibold"> Sarah Chen, Early Access Customer</p>
            <p className="text-xs text-success">✅ Verified Purchase</p>
            </div>
            
            <div className="bg-muted/20 rounded-xl p-6 border border-border">
            <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                <Star key={i} className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                ))}
            </div>
            <p className="text-muted-foreground mb-4">
                "The Skills Gap Analysis in my Career Transition Report was spot-on. Transitioned from support to RevOps in 4 months using the Career Pivot Toolkit!"
            </p>
            <p className="font-semibold"> Marcus Rodriguez, Early Access Customer</p>
            <p className="text-xs text-success">✅ Verified Purchase</p>
            </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
            <TrendingUp className="mr-2 text-success" size={16} />
            $40K Avg. Salary Increase
            </div>
            <div className="flex items-center">
            <Clock className="mr-2 text-primary" size={16} />
            3.5 Month Avg. Transition
            </div>
        </div>
        </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-warning">
            85M Jobs Will Be Displaced by 2025
            </h2>

            <p className="text-xl text-muted-foreground">
            Don't wait to AI-proof your career. Get your personalized Career Transition Report with 21-Day Action Sprint now.
            </p>
        </div>

        {/* Mobile-Optimized Progress */}
        <div className="max-w-sm mx-auto bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
            <span className="text-red-400 font-medium">URGENT:</span>
            <span className="text-red-400 font-bold">{spotsRemaining} early access spots left</span>
            </div>
            <div className="w-full bg-red-900/30 rounded-full h-2 mb-2">
            <div 
                className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full animate-pulse" 
                style={{ width: `${reservedSpots}%` }}
            />
            </div>
            <CountdownTimer start={start} remaining={daysToLaunch} />
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-through">Regular Price: $99</p>
            <p className="text-3xl md:text-4xl font-bold text-warning">Early Access: $29</p>
            <p className="text-success font-medium">+ FREE Resume Template Library ($47 value)</p>
            </div>

            <WaitlistEmailCapture
            title="Get Your Career Transition Report + 21-Day Action Sprint"
            emailPlaceholder="Enter your email for early access"
            buttonText="Get My Career Transition Report - $29"
            />

            <p className="text-sm text-muted-foreground">
              No refunds • Secure payment via Stripe
            </p>
        </div>
        </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
        <p>© 2025 CareerPath AI. All rights reserved. • No refunds on digital products</p>
        </div>
        </footer>
        </div>
    </main>
)};