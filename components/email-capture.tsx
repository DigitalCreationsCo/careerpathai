"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner"

export const EmailCapture = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Success!",
      description: "You're on the waitlist. We'll notify you when CareerPath AI launches!",
    });
    
    setEmail('');
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
        required
      />
      <Button 
        type="submit" 
        variant="cta" 
        size="lg"
        disabled={isLoading}
        className="sm:w-auto w-full"
      >
        {isLoading ? 'Joining...' : 'Get Early Access'}
      </Button>
    </form>
  );
};