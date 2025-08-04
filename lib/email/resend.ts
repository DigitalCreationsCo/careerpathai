import { Resend } from "resend";

if (!process.env.RESEND_API_KEY)
    throw new Error('RESEND_API_KEY environment variable is not set');

const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };
export type EmailState = { error: string } | { data: string };