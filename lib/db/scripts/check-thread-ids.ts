import { db } from '@/lib/db/drizzle';
import { researchSessions } from '@/lib/db/schema';

const sessions = await db.select().from(researchSessions);

const issues = sessions.filter(s => !s.threadId);

console.log('Sessions without threadId:', issues.length);
console.log('Total sessions:', sessions.length);

if (issues.length > 0) {
  console.log('Problematic sessions:', issues.map(s => s.id));
}