"use client"
import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ start = new Date(), remaining }:{start: Date; remaining: number; }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = start
    targetDate.setDate(targetDate.getDate() + remaining);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [start]);

  return (
    <div className="flex gap-4 justify-center items-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center bg-gradient-card rounded-lg p-3 border border-border">
          <div className="text-2xl font-bold text-accent">{value.toString().padStart(2, '0')}</div>
          <div className="text-xs uppercase text-muted-foreground">{unit}</div>
        </div>
      ))}
    </div>
  );
};