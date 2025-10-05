import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import logoSm from '@/app/favicon-32x32.png'
import logoLg from '@/app/android-chrome-192x192.png'

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

export const copyright = "© 2025, GoCareerPath. All rights reserved. AI-Proof Your Career"

export const Logo = ({size = "sm"}) => size === "sm" ? (
  <img src={logoSm.src} className='pt-1' />
) : (
  <img src={logoLg.src} height={75} width={75} className='pt-1' />
)