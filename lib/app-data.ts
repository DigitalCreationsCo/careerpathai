export const start = new Date('2025-08-03T00:00:00');
export const getHoursToLaunch = (startDate: Date):number => {
  const now = new Date();
  const diffms = Math.abs(now.getTime()-startDate.getTime());
  return diffms / (1000 * 60 * 60);
}

export const numJobsDisplaced = '85M';
export const dateJobsDisplaced = 2027;

export const copyright = "© 2025 CareerPath AI. All rights reserved. • AI-Proof Your Career Today"