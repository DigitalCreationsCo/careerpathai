import { getResend, EmailState, adminEmailAddress } from "./resend";
import { ReportEmail } from "@/components/emails/report-email/report-email";

export async function sendReportEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const markdownContent = formData.get("markdownContent")! as string;

  if (!markdownContent) {
    throw new Error("Missing markdownContent: Cannot send report email without report content.");
  }

  const { data, error } = await getResend().emails.send({
    from: `GoCareerPath <${adminEmailAddress}>`,
    to: [email],
    subject: "Your personalized career path report is ready!",
    react: ReportEmail({ markdownContent }),
  });

  if (error) {
    return { error: error.message };
  }

  console.log(data);

  return { data: "Email sent!" };
}
