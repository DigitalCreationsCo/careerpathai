import { db } from "../drizzle";
import { waitlist } from "@/lib/db/schema";

export async function addToWaitlist({username, email }: { username: string, email: string }) {
  await db.insert(waitlist).values({
    username,
    email: email.toLowerCase(),
  });
}
