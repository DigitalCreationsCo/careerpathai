import { getResend, EmailState, adminEmailAddress } from "./resend";
import { ReportEmail } from "@/components/emails/report-email/report-email";

export async function sendCareerPathReportEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const markdownContent = formData.get("markdownContent") as string | undefined;

  const { data, error } = await getResend().emails.send({
    from: `GoCareerPath <${adminEmailAddress}>`,
    to: [email],
    subject: "Your Personalized Career Path Report is Ready! (Early Access: $29, 48 Hours Only)",
    react: ReportEmail({ markdownContent }),
  });

  if (error) {
    return { error: error.message };
  }

  console.log(data);

  return { data: "Email sent!" };
}
