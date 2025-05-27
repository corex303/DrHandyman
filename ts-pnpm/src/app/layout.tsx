import { Metadata } from 'next';
import { Inter, Lora,Poppins } from 'next/font/google';
import * as React from 'react';
// import PageLayout from '@/components/layout/PageLayout'; // PageLayout seems unused, commenting out
import { Toaster } from 'react-hot-toast';

import '@/styles/globals.css';

import { getSiteAppearanceSettings } from '@/lib/settings'; // Import the centralized helper

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
// import { SessionProvider } from "next-auth/react"; // Removed direct import
import Providers from '@/components/layout/Providers'; // Added Providers import

// !STARTERCONF This is for demo purposes, remove @/styles/colors.css import immediately
// import '@/styles/colors.css'; // Commenting out or removing if colors are now dynamic
import { siteConfig } from '@/constant/config';

// Keep for type, default only as ultimate fallback if needed

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const appearanceSettings = await getSiteAppearanceSettings();

  const themeClass = appearanceSettings.theme === 'dark' ? 'dark' : 'light';
  
  const globalFontFamily = appearanceSettings.fonts?.global || 'var(--font-inter)';
  const headingFontFamily = appearanceSettings.fonts?.heading || 'var(--font-lora)';

  const fontOverrideVariables = {
    '--font-global-override': globalFontFamily,
    '--font-heading-override': headingFontFamily,
  } as React.CSSProperties;

  const inlineStyles = `\n    :root {\n      --font-global: ${globalFontFamily};\n      --font-heading: ${headingFontFamily};\n    }\n    body {\n      font-family: var(--font-global-override, var(--font-inter));\n    }\n    h1, h2, h3, h4, h5, h6 {\n      font-family: var(--font-heading-override, var(--font-lora));\n    }\n  `;

  return (
    <html lang="en" className={`${themeClass} font-sans`} style={fontOverrideVariables}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
      </head>
      <body className={`${inter.variable} ${lora.variable} ${poppins.variable} antialiased bg-background-light text-text-dark`}>
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
