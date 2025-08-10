import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope, Lato } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries/user';
import { SWRConfig } from 'swr';
import { Toaster } from "@/components/ui/sonner"
import { GoogleTagManager } from '@/lib/googletagmanager';
import Head from 'next/head';
import { dateJobsDisplaced, numJobsDisplaced } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'GoCareerPath — Pivot your skills to AI-resistant careers',
  description: `AI is eliminating ${numJobsDisplaced} jobs by ${dateJobsDisplaced}. Get your personalized Career Transition Report.`
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });
const lato = Lato({ subsets: ['latin'], weight: "400" });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <Head>
        <GoogleTagManager />
      </Head>
      <body className="min-h-[100dvh] bg-background">
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N5RPQTFM"
        height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>

        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser(),
              '/api/team': getTeamForUser()
            }
          }}
        >
          <Toaster position="bottom-center" />
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
