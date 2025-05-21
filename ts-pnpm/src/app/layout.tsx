import { Metadata } from 'next';
import * as React from 'react';
import prisma from '@/lib/prisma';
import { Inter, Poppins } from 'next/font/google';
import '@/styles/globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
// import PageLayout from '@/components/layout/PageLayout'; // PageLayout seems unused, commenting out
import { Toaster } from 'react-hot-toast';
import { AppearanceSettings, defaultAppearanceSettings } from '@/types/appearance'; // Keep for type, default only as ultimate fallback if needed
import { getSiteAppearanceSettings } from '@/lib/settings'; // Import the centralized helper
// import { SessionProvider } from "next-auth/react"; // Removed direct import
import Providers from '@/components/layout/Providers'; // Added Providers import

// !STARTERCONF This is for demo purposes, remove @/styles/colors.css import immediately
// import '@/styles/colors.css'; // Commenting out or removing if colors are now dynamic

import { siteConfig } from '@/constant/config';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// !STARTERCONF Change these default meta
// !STARTERCONF Look at @/constant/config to change them
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'Dr. Handyman | Professional Home Repair & Renovation Services',
    template: '%s | Dr. Handyman',
  },
  description: 'Professional handyman services for all your home repair and renovation needs. Quality workmanship guaranteed.',
  keywords: ['handyman', 'home repair', 'renovation', 'home maintenance', 'professional services'],
  authors: [
    {
      name: 'Dr. Handyman',
      url: siteConfig.url,
    },
  ],
  creator: 'Dr. Handyman',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: 'Dr. Handyman | Professional Home Repair & Renovation Services',
    description: 'Professional handyman services for all your home repair and renovation needs. Quality workmanship guaranteed.',
    siteName: 'Dr. Handyman',
    images: [
      {
        url: `${siteConfig.url}/images/og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Dr. Handyman',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    shortcut: '/favicon.ico',
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const appearanceSettings = await getSiteAppearanceSettings();

  const themeClass = appearanceSettings.theme === 'dark' ? 'dark' : 'light';
  
  const globalFont = appearanceSettings.fonts?.global || defaultAppearanceSettings.fonts?.global || 'sans-serif';
  const headingFont = appearanceSettings.fonts?.heading || defaultAppearanceSettings.fonts?.heading || 'sans-serif';

  const siteColors = { ...defaultAppearanceSettings.colors, ...(appearanceSettings.colors || {}) };

  const colorVariables = Object.entries(siteColors)
    .map(([key, value]) => `--color-${key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`)}: ${value};`)
    .join('\n    ');

  const fontVariables = {
    '--font-global': globalFont,
    '--font-heading': headingFont,
  } as React.CSSProperties;

  const cssVariables = `\n          :root {\n            ${colorVariables}\n            --font-global: ${globalFont};\n            --font-heading: ${headingFont};\n          }\n          body {\n            font-family: var(--font-global);\n            color: var(--color-text-body);\n            background-color: var(--color-background-site);\n          }\n          h1, h2, h3, h4, h5, h6 {\n            font-family: var(--font-heading);\n            color: var(--color-text-heading);\n          }\n        `;

  return (
    <html lang="en" className={themeClass} style={fontVariables}>
      <head>
        {appearanceSettings.faviconUrl && (
          <link rel="icon" href={appearanceSettings.faviconUrl} type="image/x-icon" />
        )}
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <Providers>
          <Toaster position="top-center" reverseOrder={false} />
          <Header appearanceSettings={appearanceSettings} />
          <main className="flex-grow">{children}</main>
          <Footer appearanceSettings={appearanceSettings} />
        </Providers>
      </body>
    </html>
  );
}
