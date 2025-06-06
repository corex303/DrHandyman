import { Metadata, Viewport } from 'next';
import { Inter, Lora, Poppins } from 'next/font/google';
import * as React from 'react';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from 'next-auth/react';

import '@/styles/globals.css';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import Providers from '@/components/layout/Providers';

import { defaultAppearanceSettings } from '@/types/appearance';

// import { siteConfig } from '@/constant/config'; // Keep commented if generateMetadata is simplified

import { cn } from '@/lib/utils';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Using the previously simplified generateMetadata to avoid unrelated errors
export async function generateMetadata(): Promise<Metadata> {
  const siteTitle = 'Dr. Handyman | Professional Home Repair & Renovation Services';
  const siteDescription = 'Professional handyman services for all your home repair and renovation needs. Quality workmanship guaranteed.';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://drhandymannc.com';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      title: siteTitle,
      description: siteDescription,
      siteName: siteTitle,
    },
    robots: { index: true, follow: true },
    icons: { icon: '/images/favicon.png' }, 
    manifest: `${siteUrl}/site.webmanifest`,
  };
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export const viewport: Viewport = {
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: defaultAppearanceSettings.colors?.primary || '#FFFFFF',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: defaultAppearanceSettings.colors?.accent || '#000000',
    },
  ],
  colorScheme: 'light dark',
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const themeClass = defaultAppearanceSettings.theme === 'dark' ? 'dark' : 'light';
  
  const globalFontFamily = defaultAppearanceSettings.fonts?.body || 'var(--font-inter)';
  const headingFontFamily = defaultAppearanceSettings.fonts?.heading || 'var(--font-lora)';

  return (
    <html
      lang="en"
      className={cn(
        'antialiased',
        themeClass,
        inter.variable,
        lora.variable,
        poppins.variable
      )}
      style={
        {
          '--font-global': globalFontFamily,
          '--font-heading': headingFontFamily,
        } as React.CSSProperties
      }
    >
      <head />
      <body className="flex flex-col min-h-screen font-sans">
        <Providers>
          <Toaster position="top-center" reverseOrder={false} />
          <Header appearanceSettings={defaultAppearanceSettings} />
          <main className="flex-grow">{children}</main>
          <Footer appearanceSettings={defaultAppearanceSettings} />
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
