import '../landing.css'
import { CheckCircle, Star, Zap } from 'lucide-react';
import { Browser } from '@/components/browser';
import { WaitlistEmailCapture } from '@/components/waitlist-email-capture';

export default async function FreePreviewPage() {
  return (
    <main>
      <div className="min-h-screen bg-gradient-hero text-foreground overflow-hidden">
        Free Preview
      </div>
    </main>
  );
}
