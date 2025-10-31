import { dateJobsDisplaced, numJobsDisplaced } from "@/lib/utils";
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
  username: string;
  previewLink?: string;
  spotNumber?: number;
}

export const WaitlistEmail = ({
  username,
  previewLink = "https://gocareerpath.com/preview",
  spotNumber = Math.floor(Math.random() * 73) + 1,
}: WaitlistEmailProps) => {
  const previewText =
    "Spot #" + spotNumber + " confirmed. We'll notify you when Career Path Reports launch.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white mx-auto font-sans px-2">
          <Container className="rounded my-[40px] mx-auto p-[20px] max-w-[465px] border border-[#eaeaea] shadow-sm">

            {/* LogoImage */}
            <Section className="mt-[8px] text-center flex items-center justify-center gap-2">
              <Img
                src="https://www.gocareerpath.com/favicon.ico"
                width="25"
                height="25"
                alt="GoCareerPath"
                className="inline"
              />
              <Text className="inline m-0 font-bold text-lg">GoCareerPath</Text>
            </Section>

            {/* Confirmation Badge */}
            <Section className="text-center mt-[20px]">
              <div className="bg-green-100 rounded-lg px-4 py-2 inline-block">
                <Text className="text-sm font-semibold m-0">
                  ✅ Waitlist Spot Confirmed
                </Text>
              </div>
            </Section>

            {/* Headline */}
            <Heading className="text-[22px] font-bold text-center mt-[24px] mb-[16px] text-black">
              You're Spot #{spotNumber}, {username}
            </Heading>

            {/* Simple Confirmation */}
            <Text className="text-black text-sm leading-[22px]">
              Your spot on the <strong>GoCareerPath </strong> waitlist is confirmed. 
              We'll email you as soon as <strong>Career Path Reports</strong> are available.
            </Text>

            {/* What to Expect */}
            <Text className="text-black text-sm leading-[22px] mt-[16px]">
              <strong>What you'll get when we launch:</strong>
            </Text>

            <ul className="text-black text-sm leading-[22px] list-none m-0 mt-2 p-0">
              <li className="mb-2">🎯 3-4 AI-resistant career paths matched to your skills</li>
              <li className="mb-2">📊 Complete automation risk analysis for each role</li>
              <li className="mb-2">🚀 30-Day Sprint with step-by-step actions</li>
              <li className="mb-2">📋 Skills Gap Analysis with learning resources</li>
              <li className="mb-2">💼 Career Pivot Toolkit (outreach templates + salary negotiation script)</li>
            </ul>

            {/* Market Context */}
            <Section className="bg-muted rounded-lg p-4 mt-[20px]">
              <Text className="text-black text-sm font-semibold m-0">
                Why This Matters Now
              </Text>
              <Text className="text-[13px] leading-[20px] mt-1 mb-0 text-muted-foreground">
                {`${numJobsDisplaced} jobs will be displaced by ${dateJobsDisplaced}. Waitlist members get first access to identify future-proof career paths before the competition.`}
              </Text>
            </Section>

            {/* Preview CTA */}
            <Section className="text-center my-[20px]">
              <Text className="text-[13px] text-gray-600">
                Get a taste of what your full report will include
              </Text>
              <Button
                className="bg-primary rounded text-white font-semibold px-6 py-3"
                href={previewLink}
              >
                See Preview Sample
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] mb-[20px] w-full" />

            <Text className="text-center text-gray-600 text-sm leading-[20px] mt-[12px]">
              Questions? Just reply to this email and we'll get back to you.
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};