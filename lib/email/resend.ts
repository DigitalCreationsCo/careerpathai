import { Resend } from "resend";

export const adminEmailAddress = 'support@gocareerpath.com'

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

export type EmailState = { error: string } | { data: string };
