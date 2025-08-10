import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const launch = new Date(2025, 7, 14, 0, 0, 0);
export const calculateTimeRemaining = (launch: Date): { days: number; hours: number } => {
    const now = new Date();
    const diffMs = launch.getTime() - now.getTime();
  
    if (diffMs <= 0) {
      return { days: 0, hours: 0 };
    }
  
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
  
    return { days, hours };
};   

  
export const numJobsDisplaced = '85M';
export const dateJobsDisplaced = 2027;

export const copyright = "© 2025 CareerPath AI. All rights reserved. • AI-Proof Your Career Today"