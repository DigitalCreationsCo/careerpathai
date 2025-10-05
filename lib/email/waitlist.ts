import { resend, EmailState, adminEmailAddress } from "./resend";
import { WaitlistEmail } from "@/components/emails/waitlist-email/waitlist-email";

export async function sendWaitlistConfirmationEmail(formData: FormData):Promise<EmailState> {
  const email = formData.get("email") as string; 
  const username = formData.get("username") as string;

  const { data, error } = await resend.emails.send({
    from: `GoCareerPath <${adminEmailAddress}>`,
    to: [email],
    subject: "Your Career Path Report Spot is Reserved",
    react: WaitlistEmail({ username }),
  });

  if (error) {
    console.error('sendWaitlistConfirmationEmail: ', error);
    throw error;
  }

  console.log(data);

  return { data: "Email sent!" };
}
