import { resend, EmailState, adminEmailAddress } from "./resend";
import { InviteUserEarlyAccessEmail } from "@/components/emails/invite-user-early-access-email/invite-user-early-access-email";

export async function sendEarlyAccessInviteEmail(formData: FormData) {
  const email = formData.get("email") as string; 
  const username = formData.get("username") as string;

  const { data, error } = await resend.emails.send({
    from: `GoCareerPath <${adminEmailAddress}>`,
    to: [email],
    subject: "Secure Your 3 Future‑Proof Career Paths (Only 100 Early Access Spots)",
    react: InviteUserEarlyAccessEmail({ username }),
  });

  if (error) {
    return { error: error.message };
  }

  console.log(data);

  return { data: "Email sent!" };
}