import { Resend } from "resend";

if (!process.env.RESEND_API_KEY)
    throw new Error('RESEND_API_KEY environment variable is not set');

const resend = new Resend(process.env.RESEND_API_KEY);

export const adminEmailAddress = 'support@gocareerpath.com'

export { resend };
export type EmailState = { error: string } | { data: string };