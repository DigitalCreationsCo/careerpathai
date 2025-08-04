import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface InviteUserEarlyAccessEmailProps {
  username?: string;
  inviteLink?: string;
}

export const InviteUserEarlyAccessEmail = ({
  username = "Alex",
  inviteLink = "https://careerpath.ai/early-access",
}: InviteUserEarlyAccessEmailProps) => {
  const previewText =
    "Secure your CareerPath AI Early Access — limited to 100 spots.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            {/* Logo */}
            <Section className="mt-[16px] text-center">
              <Img
                src="https://careerpath.ai/logo.png"
                width="48"
                height="48"
                alt="CareerPath AI"
                className="mx-auto"
              />
            </Section>

            {/* Headline */}
            <Heading className="text-black text-[22px] font-bold text-center my-[24px]">
              {username}, Claim Your Career Transition Report — Early Access
            </Heading>

            {/* Intro */}
            <Text className="text-black text-[14px] leading-[22px]">
              AI is reshaping the job market. The smartest move you can make now
              is to map your next career step — before the market decides for you.
            </Text>

            {/* What they get */}
            <Text className="text-black text-[14px] leading-[22px] mt-[16px]">
              Your <strong>Career Transition Report</strong> includes:
            </Text>
            <ul className="text-black text-[14px] leading-[22px] list-disc ml-5">
              <li>3–4 lucrative, low-automation-risk Career Paths from your current skills</li>
              <li>Skills Gap Analysis & Market Intelligence</li>
              <li>Automation & Transferability Scores</li>
              <li>Outreach Templates + Salary Negotiation Scripts</li>
              <li>Full 21-Day Pivot Sprint implementation plan</li>
            </ul>

            {/* Urgency */}
            <Text className="text-black text-[14px] leading-[22px] mt-[16px]">
              <strong>Early Access is limited to the first 100 people</strong> —
              secure your spot today for just $29.
            </Text>

            {/* CTA */}
            <Section className="text-center mt-[24px] mb-[24px]">
              <Button
                className="bg-[#000000] rounded text-white text-[14px] font-semibold no-underline px-5 py-3"
                href={inviteLink}
              >
                Get My Career Transition Report — $29 Early Access
              </Button>
            </Section>

            {/* Backup link */}
            <Text className="text-black text-[12px] leading-[20px]">
              Or copy and paste this link into your browser:{" "}
              <Link
                href={inviteLink}
                className="text-blue-600 no-underline break-all"
              >
                {inviteLink}
              </Link>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[24px] mx-0 w-full" />

            {/* Footer note */}
            <Text className="text-[#666666] text-[12px] leading-[20px]">
              No refunds. Early Access discount only applies before launch.  
              Questions? Reply to this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteUserEarlyAccessEmail;
