import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from "@react-email/components";
import * as React from "react";
import ReactMarkdown from "react-markdown";

interface ReportEmailProps {
  markdownContent?: string;
}

export const ReportEmail = ({
  markdownContent = "",
}: ReportEmailProps) => {
  const previewText = "Your Career Report is Ready!";
  // Create a Blob download link for the markdown as PDF.
  // Since email clients do not run JS, we use a fallback HTTP download link (handled on the app/website).

  // You would want to provide a pre-generated PDF download link in production,
  // For demonstration, the "download as PDF" button will link to a /api/report/pdf?content=... endpoint.
  // (In a real application, you would create this endpoint to generate/render PDF from markdown.)

  // URL-safe encode the markdown to send as a parameter to API endpoint.
  const encodedMarkdown =
    typeof markdownContent === "string"
      ? encodeURIComponent(markdownContent)
      : "";

  // Replace below with your actual PDF generator endpoint if desired.
  const pdfDownloadUrl = encodedMarkdown
    ? `https://www.gocareerpath.com/api/report/pdf?content=${encodedMarkdown}`
    : "#";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="border bg-white mx-auto font-sans px-2">
          <Container className="rounded my-[40px] mx-auto p-[20px] max-w-[650px]">
            <Section>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown skipHtml={false}>
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </Section>
            {/* Download as PDF button or link */}
            <Section className="text-center mt-6">
              <Button
                href={pdfDownloadUrl}
                className="bg-primary rounded text-white text-[16px] font-bold no-underline px-8 py-4"
                target="_blank"
              >
                Download this report as PDF
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};