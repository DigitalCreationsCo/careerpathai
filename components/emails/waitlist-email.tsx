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

interface WaitlistEmailProps {
  username?: string;
  inviteLink?: string;
}

export const WaitlistEmail = ({
  username = "Alex",
  inviteLink = "https://careerpath.ai/early-access",
}: WaitlistEmailProps) => {
  const previewText =
    "Your early access spot is confirmed. We'll notify you when your Career Transition Report is available.";

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

            {/* Confirmation Badge */}
            <Section className="text-center mt-[16px]">
              <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 inline-block">
                <Text className="text-green-700 text-[14px] font-semibold my-0">
                  ✅ Early Access Spot Confirmed
                </Text>
              </div>
            </Section>

            {/* Headline */}
            <Heading className="text-black text-[22px] font-bold text-center my-[24px]">
              {username}, You're In! Spot #{Math.floor(Math.random() * 73) + 1}/100 Reserved
            </Heading>

            {/* Confirmation message */}
            <Text className="text-black text-[14px] leading-[22px]">
              Perfect timing. Your early access spot for the <strong>Career Transition Report</strong> is officially reserved.
            </Text>

            <Text className="text-black text-[14px] leading-[22px] mt-[16px]">
              <strong>What happens next:</strong>
            </Text>
            
            <ul className="text-black text-[14px] leading-[22px] list-none ml-0 mt-[8px]">
              <li className="mb-2">📧 <strong>Within 48 hours:</strong> We'll email you when your Career Transition Report is ready to claim</li>
              <li className="mb-2">💰 <strong>Your locked-in price:</strong> $29 (reg. $99) — honor price guaranteed</li>
              <li className="mb-2">🎁 <strong>Included bonuses:</strong> Resume Template Library + Preview Sample</li>
            </ul>

            {/* What they'll get reminder */}
            <Section className="bg-gray-50 rounded-lg p-4 mt-[20px]">
              <Text className="text-black text-[14px] leading-[22px] my-0 font-semibold">
                Your Career Transition Report will include:
              </Text>
              <ul className="text-black text-[13px] leading-[20px] list-disc ml-5 mt-[8px] mb-0">
                <li>3-4 AI-resistant Career Paths matched to your skills</li>
                <li>Complete Skills Gap Analysis with learning hours</li>
                <li>14-Day Action Sprint implementation plan</li>
                <li>Career Pivot Toolkit (templates + scripts)</li>
                <li>Market Intelligence & Automation Risk Scores</li>
              </ul>
            </Section>

            {/* Urgency reminder */}
            <Text className="text-black text-[14px] leading-[22px] mt-[16px] font-semibold">
              ⏰ Only {100 - Math.floor(Math.random() * 73) - 1} spots remaining
            </Text>

            <Text className="text-black text-[14px] leading-[22px]">
              You beat the rush. When we email you, you'll have 24 hours to claim your discounted Career Transition Report before we move to the next person on the waitlist.
            </Text>

            {/* Optional: Preview link */}
            <Section className="text-center mt-[24px] mb-[24px]">
              <Button
                className="bg-blue-600 rounded text-white text-[14px] font-semibold no-underline px-5 py-3"
                href={inviteLink}
              >
                View Preview Sample (Free)
              </Button>
            </Section>

            <Hr className="border border-solid border-[eaeaea] my-[24px] mx-0 w-full" />

            {/* Footer note */}
            <Text className="text-[#666666] text-[12px] leading-[20px]">
              Keep this email — we'll reference your spot number when we notify you. 
              Early access closes once all 100 spots are claimed.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[20px] mt-[12px]">
              Questions? Just reply to this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WaitlistEmail;