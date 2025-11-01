#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";

/**
 * Generator script to create email components, storybook files, and server functions
 * 
 * Usage: npx tsx scripts/generate-email.ts <email-name>
 * 
 * Example: npx tsx scripts/generate-email.ts welcome-email
 * 
 * This will create:
 * - components/emails/welcome-email/welcome-email.tsx
 * - components/emails/welcome-email/welcome-email.stories.ts
 * - lib/email/send-welcome-email.ts
 */

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function toCamelCase(str: string): string {
  const kebab = toKebabCase(str);
  return kebab.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function generateEmailComponent(emailName: string): string {
  const componentName = toPascalCase(emailName);
  const propsName = `${componentName}Props`;

  return `import {
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

interface ${propsName} {
  // Add your props here
  username?: string;
}

export const ${componentName} = ({
  username = "User",
}: ${propsName}) => {
  const previewText = "Your email preview text here";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white mx-auto font-sans px-2">
          <Container className="rounded my-[40px] mx-auto p-[20px] max-w-[465px] border border-[#eaeaea] shadow-sm">

            {/* Logo */}
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

            {/* Headline */}
            <Heading className="text-[22px] font-bold text-center mt-[24px] mb-[16px] text-black">
              Hello, {username}!
            </Heading>

            {/* Content */}
            <Text className="text-black text-sm leading-[22px]">
              Your email content goes here.
            </Text>

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
`;
}

function generateStorybookFile(emailName: string): string {
  const componentName = toPascalCase(emailName);
  const fileName = toKebabCase(emailName);

  return `import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ${componentName} } from './${fileName}';

const meta = {
  title: 'Email/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ${componentName}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    username: "Andres",
  },
};
`;
}

function generateServerFile(emailName: string): string {
  const componentName = toPascalCase(emailName);
  const functionName = `send${componentName}`;
  const fileName = toKebabCase(emailName);

  return `import { getResend, EmailState, adminEmailAddress } from "./resend";
import { ${componentName} } from "@/components/emails/${emailName}/${fileName}";

export async function ${functionName}(formData: FormData): Promise<EmailState> {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;

  const { data, error } = await getResend().emails.send({
    from: \`GoCareerPath <\${adminEmailAddress}>\`,
    to: [email],
    subject: "Your Email Subject Here",
    react: ${componentName}({ username }),
  });

  if (error) {
    console.error('${functionName}: ', error);
    throw error;
  }

  console.log(data);

  return { data: "Email sent!" };
}
`;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: Email name is required");
    console.log("\nUsage: npx tsx scripts/generate-email.ts <email-name>");
    console.log("\nExample: npx tsx scripts/generate-email.ts welcome-email");
    process.exit(1);
  }

  const emailName = toKebabCase(args[0]);

  if (!emailName) {
    console.error("Error: Invalid email name");
    process.exit(1);
  }

  // Resolve paths relative to project root (where package.json is)
  const rootDir = process.cwd();
  const emailDir = path.join(rootDir, "components", "emails", emailName);
  const libEmailDir = path.join(rootDir, "lib", "email");

  // Create email component directory
  if (!fs.existsSync(emailDir)) {
    fs.mkdirSync(emailDir, { recursive: true });
    console.log(`✓ Created directory: components/emails/${emailName}`);
  } else {
    console.warn(`⚠ Directory already exists: components/emails/${emailName}`);
  }

  // Generate email component file
  const componentFileName = `${emailName}.tsx`;
  const componentFilePath = path.join(emailDir, componentFileName);
  if (!fs.existsSync(componentFilePath)) {
    fs.writeFileSync(componentFilePath, generateEmailComponent(emailName));
    console.log(`✓ Created: components/emails/${emailName}/${componentFileName}`);
  } else {
    console.warn(`⚠ File already exists: components/emails/${emailName}/${componentFileName}`);
  }

  // Generate storybook file
  const storiesFileName = `${emailName}.stories.ts`;
  const storiesFilePath = path.join(emailDir, storiesFileName);
  if (!fs.existsSync(storiesFilePath)) {
    fs.writeFileSync(storiesFilePath, generateStorybookFile(emailName));
    console.log(`✓ Created: components/emails/${emailName}/${storiesFileName}`);
  } else {
    console.warn(`⚠ File already exists: components/emails/${emailName}/${storiesFileName}`);
  }

  // Generate server file
  const serverFileName = `send-${emailName}.ts`;
  const serverFilePath = path.join(libEmailDir, serverFileName);
  if (!fs.existsSync(serverFilePath)) {
    fs.writeFileSync(serverFilePath, generateServerFile(emailName));
    console.log(`✓ Created: lib/email/${serverFileName}`);
  } else {
    console.warn(`⚠ File already exists: lib/email/${serverFileName}`);
  }

  console.log(`\n✓ Successfully generated email: ${emailName}`);
  console.log("\nNext steps:");
  console.log(`1. Edit components/emails/${emailName}/${componentFileName} to customize the email template`);
  console.log(`2. Update the props interface and default values`);
  console.log(`3. Edit lib/email/${serverFileName} to customize the email sending logic`);
  console.log(`4. Update the email subject and any additional FormData fields needed`);
}

main();

