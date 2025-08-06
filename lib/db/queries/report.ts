import { count, desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { Report, reports, users } from '../schema';
import { getUser } from '@/lib/db/queries/user';

export async function getReports() {
  return await db
    .select()
    .from(reports)
    .orderBy(desc(reports.id))
    .limit(100)
}

export async function getReportById(id: number):Promise<Report> {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1) as unknown as Report;
}

export async function getReportsCount(): Promise<number> {
  const countReports = await db
    .select({ count: count() })
    .from(reports)
    .limit(100)
  return countReports[0].count
}