import { copyright } from "@/lib/utils";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ReportEmailProps {
  markdownContent: string;
  pdfDownloadUrl?: string;
}

export const ReportEmail = ({
  markdownContent = "",
  pdfDownloadUrl, 
}: ReportEmailProps) => {
  const previewText = "Your Personalized Career Report is Ready!";
  const encodedMarkdown =
    typeof markdownContent === "string"
      ? encodeURIComponent(markdownContent)
      : "";

  const downloadUrl =
    pdfDownloadUrl ||
    (encodedMarkdown
      ? `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.gocareerpath.com"}/api/report/pdf?content=${encodedMarkdown}`
      : "#");

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white mx-auto font-sans px-2">
          <Container className="rounded my-[40px] mx-auto p-[20px] max-w-[465px] shadow-sm">

            {/* Logo */}
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
              <div className="bg-success/20 px-4 py-2 inline-block">
                <Text className="text-sm m-0">
                  🎉 Your Personalized Career Report is ready!
                </Text>
              </div>
            </Section>

            {/* --- HOMOGENIZED WHAT'S INSIDE CONTENT --- */}
            <Section className="mt-[16px] mb-[0px]">
              <Text className="text-black text-2xl text-accent mt-4 mb-4 text-center">
                What’s Inside
              </Text>
              <ul className="ml-6 mb-2 text-black text-[15px] leading-[22px]">
                <li className="mb-4 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Summary">📝</span>
                  <div>
                    <span className="font-semibold">Executive Summary</span>
                    <div className="text-[14px] text-black font-normal">
                      Personalized overview of your career strengths and opportunities.
                    </div>
                  </div>
                </li>
                <li className="mb-4 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Paths">🏆</span>
                  <div>
                    <span className="font-semibold">Top 4 Career Paths</span>
                    <div className="text-[14px] text-black font-normal">
                      Targeted options matched to your background, goals, and interests.
                    </div>
                  </div>
                </li>
                <li className="mb-4 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Market">💹</span>
                  <div>
                    <span className="font-semibold">Market Data &amp; Salary Projections</span>
                    <div className="text-[14px] text-black font-normal">
                      Latest salary, growth, and job stats for your recommended paths.
                    </div>
                  </div>
                </li>
                <li className="mb-4 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Target">🎯</span>
                  <div>
                    <span className="font-semibold">Custom Strategy Plan</span>
                    <div className="text-[14px] text-black font-normal">
                      A step-by-step roadmap to pivot into resilient roles that fit your background.
                    </div>
                  </div>
                </li>
                <li className="mb-4 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Roadmap">🗺️</span>
                  <div>
                    <span className="font-semibold">Learning Roadmap</span>
                    <div className="text-[14px] text-black font-normal">
                      A Step-by-step guide to building key skills for your new direction.
                    </div>
                  </div>
                </li>
                <li className="mb-4 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Book">📚</span>
                  <div>
                    <span className="font-semibold">Skills Gap Analysis</span>
                    <div className="text-[14px] text-black font-normal">
                      See exactly which skills to upgrade (and which to skip) without wasting time or money.
                    </div>
                  </div>
                </li>
                <li className="mb-4 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Rocket">🚀</span>
                  <div>
                    <span className="font-semibold">30-Day Sprint</span>
                    <div className="text-[14px] text-black font-normal">
                      Compact, daily action plan for rapid momentum—start moving on day one.
                    </div>
                  </div>
                </li>
                <li className="mb-2 flex items-start">
                  <span className="mr-2 mt-[2px]" role="img" aria-label="Briefcase">💼</span>
                  <div>
                    <span className="font-semibold">Offer-Getting Scripts</span>
                    <div className="text-[14px] text-black font-normal">
                      Outreach templates and salary scripts designed to help land interviews and increase offers.
                    </div>
                  </div>
                </li>
              </ul>
            </Section>

            {/* Headline */}
            <Heading className="text-2xl text-center mt-[24px] mb-[24px] text-black">
              Your Career Path Report is Ready
              <br />
              <span className="text-success">Now, Take Your Next Step.</span>
            </Heading>

            {/* Instructions */}
            <Text className="text-black text-sm leading-[22px] mb-2">
              Download your personalized report and unlock your new career path.
            </Text>

            {/* Download CTA */}
            <Section className="text-center mt-[18px]">
              <Button
                className="bg-primary rounded text-white text-[16px] font-bold no-underline px-8 py-4"
                href={downloadUrl}
                target="_blank"
              >
                Download My Career Report (PDF)
              </Button>
            </Section>

            <Text className="text-[#666666] text-[12px] leading-[20px] mt-[16px]">
              This report is for your personal use only. No refunds on digital products.
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[20px] mt-[8px]">
              Questions about your report? Just reply to this email and we'll get back to you.
            </Text>
            <Text className="text-[#666666] text-center leading-[20px] mt-[8px]">
              {copyright}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};