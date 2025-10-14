"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";

export const WaitlistEmailCapture = ({

  // EARLY ACCESS AND PREVIEW SAMPLE TEXT
  // emailPlaceholder = "Enter your email for Preview Sample",
  // namePlaceholder = "Enter your first name",
  // success = "Preview Sample sent! Check your email for your free career path example, then secure your full Career Path Report.",
  // buttonText = "Get Preview Sample + Early Access - $29",
  // loadingText = 'Sending Preview Sample...',
  // title = "Get Your FREE Preview Sample First"

  // WAITLIST TEXT
  emailPlaceholder = "Enter your email",
  namePlaceholder = "Enter your name",
  success = "You're on the waitlist! Check your email for confirmation.",
  buttonText = "Join the Waitlist",
  loadingText = "Adding you to the waitlist...",
  title = "Join the CareerPath AI Waitlist"
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName) return;

    setIsLoading(true);

      const waitlistPromise = fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: firstName }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      }).catch((err:any) => { throw err; })

      toast.promise(waitlistPromise, {
        loading: "Adding you to the waitlist...",
        success: () => {
          setEmail('');
          setFirstName('');
          return success;
        },
        error: (error: any) => {
          console.error('waitlist-email-capture:', error);
          if (error.message.includes('duplicate')) {
            return "You’re already on the waitlist. We’ll keep you updated."
          }
          return error.message || "Error joining waitlist";
        }
      });

      waitlistPromise.finally(() => setIsLoading(false));
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
          required
        />
        <Input
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          disabled={isLoading || !email || !firstName}
          className="w-full"
        >
          {/* {isLoading ? loadingText : buttonText} */}
          {buttonText}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You’ll receive a confirmation email once you’re on the waitlist.
        </p>
      </div>
    </div>
  );
};
