"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { sendWaitlistConfirmationEmail } from '@/lib/email/waitlist';
import { addToWaitlist } from '@/lib/db/queries/waitlist';

export const WaitlistEmailCapture = ({

  // EARLY ACCESS AND PREVIEW SAMPLE TEXT
  // emailPlaceholder = "Enter your email for Preview Sample",
  // namePlaceholder = "Enter your first name",
  // success = "Preview Sample sent! Check your email for your free career path example, then secure your full Career Transition Report.",
  // buttonText = "Get Preview Sample + Early Access - $29",
  // loadingText = 'Sending Preview Sample...',
  // title = "Get Your FREE Preview Sample First"
  
  emailPlaceholder = "Enter your email to join the waitlist",
  namePlaceholder = "Enter your first name",
  success = "You're on the waitlist! Check your email for confirmation.",
  buttonText = "Join the Waitlist",
  loadingText = "Adding you to the waitlist...",
  title = "Join the CareerPath AI Waitlist"
}: {
  emailPlaceholder?: string;
  namePlaceholder?: string;
  success?: string;
  buttonText?: string;
  loadingText?: string;
  title?: string;
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!email || !firstName) return;

      setIsLoading(true);

      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', firstName);

      // await addToWaitlist({ username: firstName, email });
      // await sendWaitlistConfirmationEmail({ data: "", error: "" }, formData);

      toast(success);

      setEmail('');
      setFirstName('');
      setIsLoading(false);
    } catch (error: any) {
      console.error(`waitlist-email-capture: `, error);
      toast(error.message);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      {title && (
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Sign up to be notified when CareerPath AI launches.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          type="text"
          placeholder={namePlaceholder}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="flex-1 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground rounded-sm"
          required
        />
        
        <Input
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground rounded-sm"
          required
        />
        
        <Button 
          type="submit" 
          variant="cta" 
          size="lg"
          disabled={isLoading || !email || !firstName}
          className="sm:w-auto w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold"
        >
          {isLoading ? loadingText : buttonText}
        </Button>
      </form>
      
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          You’ll receive a confirmation email once you’re on the waitlist.
        </p>
      </div>
    </div>
  );
};
