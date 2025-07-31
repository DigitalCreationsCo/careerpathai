import { desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { Report, reports, users } from '../schema';
import { getUser } from './user';

export async function getReports() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select()
    .from(reports)
    // .leftJoin(users, eq(reports.userId, users.id)) // no users
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