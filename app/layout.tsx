import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope, Lato } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries/user';
import { SWRConfig } from 'swr';
import { Toaster } from "@/components/ui/sonner"
import { GoogleTagManager } from '@/lib/initGTM';
import Head from 'next/head';
import { dateJobsDisplaced, numJobsDisplaced } from '@/lib/utils';
import { Header } from '@/components/ui/header/header';

export const metadata: Metadata = {
  title: 'GoCareerPath — Find & Pivot to Your AI-Proof Career Path',
  description:
    'AI is disrupting the job market. Protect your future with a personalized AI-proof Career Transition Report. Identify high-demand, low-automation roles and map your pivot in 14 days.',
  keywords: [
    'AI-proof careers',
    'career path finder',
    'AI job disruption',
    'future of work',
    'job automation risk',
    'career pivot tool',
    'AI career advice',
    'personalized career report',
    'career change in AI age',
    'GoCareerPath'
  ],
  openGraph: {
    title: 'GoCareerPath — Find & Pivot Your Skills To An AI-Resistant Career Path',
    description:
      'Get your AI-proof Career Transition Report. Discover high-demand, low-automation jobs and learn how to pivot in 14 days.',
    url: 'https://gocareerpath.com',
    siteName: 'GoCareerPath',
    images: [
      {
        url: 'https://gocareerpath.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GoCareerPath Career Transition Tool'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoCareerPath — Find & Pivot to Your AI-Proof Career Path',
    description:
      'AI is changing work forever. Discover AI-resistant careers and get your personalized pivot plan.',
    images: ['https://gocareerpath.com/og-image.jpg']
  },
  alternates: {
    canonical: 'https://gocareerpath.com'
  }
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
      <body className="min-h-[100dvh] relative bg-background">
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
          <Header />
          {children}
          <Toaster position="bottom-center" />
        </SWRConfig>
      </body>
    </html>
  );
}
