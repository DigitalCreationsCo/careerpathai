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

interface InviteUserEarlyAccessEmailProps {
  username?: string;
  inviteLink?: string;
  spotNumber?: number;
}

export const InviteUserEarlyAccessEmail = ({
  username = "Alex",
  inviteLink = "https://gocareerpath.com", // update to survey link
  spotNumber = Math.floor(Math.random() * 73) + 1,
}: InviteUserEarlyAccessEmailProps) => {
  const previewText =
    "🚨 Early Access LIVE: Claim your $29 Career Report (48 hours only)";

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
              <Text className="inline ml-2 text-muted-foreground text-lg">GoCareerPath</Text>
            </Section>

            {/* Confirmation Badge */}
            <Section className="text-center mt-[20px]">
              <div className="bg-warning/30 px-4 py-2 inline-block">
                <Text className="text-sm font-semibold m-0">
                  🚨 Early Access is LIVE
                </Text>
              </div>
            </Section>

            {/* Headline */}
            <Heading className="text-[22px] font-bold text-center mt-[24px] mb-[16px] text-black">
              {username}, Your Career Report is Ready
              <br />
              <span className="text-warning">48 Hours to Claim $29 Price</span>
            </Heading>

            {/* Market Urgency Hook */}
            <Text className="text-black text-sm leading-[22px] font-bold">
              {`${numJobsDisplaced} jobs will be displaced by ${dateJobsDisplaced}. The window to pivot is closing fast.`}
            </Text>

            <Text className="text-black text-sm leading-[22px] mt-[12px]">
              As a waitlist member, you get <strong>first access</strong> to your personalized 
              <strong> Career Path Report</strong> at our early access price.
            </Text>

            {/* Discount Box */}
            <Section className="bg-success/20 p-4 mt-[16px]">
              <Text className="text-green-800 text-lg font-bold m-0 text-center">
                💰 Early Access: $29 (Regular Price: $49)
              </Text>
              <Text className="text-[13px] leading-[18px] mt-1 mb-0 text-green-700 text-center">
                41% savings — locked in for 48 hours only
              </Text>
            </Section>

            {/* What they get */}
            <Text className="text-black text-sm leading-[22px] mt-[16px]">
              <strong>Your Career Path Report includes:</strong>
            </Text>

            <ul className="text-black text-sm leading-[22px] list-decimal list-inside m-0 mt-2 p-0">
              <li className="mb-2">🎯 <strong>3-4 AI-resistant career paths</strong> leveraging your existing skills</li>
              <li className="mb-2">📊 <strong>Automation Risk Scores</strong> ({`all recommendations less than 40% risk`})</li>
              <li className="mb-2">🚀 <strong>30-Day Sprint</strong> with exact steps to success</li>
              <li className="mb-2">💰 <strong>Salary ranges + market demand</strong> for each path</li>
              <li className="mb-2">📋 <strong>Skills Gap Analysis</strong> with learning hours & resources</li>
              <li className="mb-2">💼 <strong>Career Pivot Toolkit</strong> (templates, scripts, guides)</li>
            </ul>

            {/* Urgency Timer */}
            <Section className="bg-warning/20 p-4 mt-[20px]">
              <Text className="text-sm font-bold m-0">
                ⏰ 48-Hour Window: Claim Your Report
              </Text>
              <Text className="text-[13px] leading-[20px] mt-1 mb-0 text-red-700">
                This early access price expires in 48 hours. After that, your spot moves to the next person on the waitlist.
              </Text>
            </Section>

            {/* Main CTA */}
            <Section className="text-center mt-[24px] mb-[20px]">
              {/* A CTA */}
              <Button
                className="bg-primary rounded text-white text-[16px] font-bold no-underline px-8 py-4"
                href={inviteLink}
              >
                Claim My $29 Career Report Now
              </Button>
            </Section>

            {/* Backup Link */}
            {/* B CTA */}
            {/* <Text className="text-black text-[12px] leading-[20px] text-center">
              <Link
                href={inviteLink}
                className="text-primary no-underline"
              >
                → Claim your early access report here ←
              </Link>
            </Text> */}
            {/* <Text className="text-[13px] text-gray-600 mt-3 mb-0">
                48-hour early access window
              </Text> */}

            {/* Social Proof & Scarcity */}

            <Hr className="border border-solid border-[#eaeaea] mt-[20px] mx-0 w-full" />

            <Section className="bg-gray-100 p-3 mt-0">
              <Text className="text-[13px] leading-[18px] m-0 h-[2rem] flex items-center justify-center text-center text-gray-700">
                <strong>{spotNumber}/100 early access spots claimed</strong>
              </Text>
            </Section>

              {/* Final Urgency Push */}
              <Text className="text-black text-sm leading-[22px] font-semibold">
              Don't wait — your career window is shrinking.
            </Text>
            
            <Text className="text-black text-sm leading-[22px] mt-[8px]">
              While others scramble to figure out their next move, you'll have a plan 
              to pivot into a <strong>high-paying, AI-resistant role</strong> using skills you already have.
            </Text>


            {/* Footer */}
            <Text className="text-[#666666] text-[12px] leading-[20px] mt-[16px]">
              <strong>Important:</strong> This $29 early access price expires in 48 hours. 
              After that, regular pricing ($49) applies. No refunds on digital products.
            </Text>
            
            <Text className="text-[#666666] text-[12px] leading-[20px] mt-[8px]">
              Questions about your Career Path Report? Just reply to this email and we'll get back to you.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};