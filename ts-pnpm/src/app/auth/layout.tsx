import { Inter, Lora, Poppins } from 'next/font/google';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { defaultAppearanceSettings } from '@/types/appearance';

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

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
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
      <body className="bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
        <div className="flex min-h-screen items-center justify-center p-4">
            {children}
        </div>
      </body>
    </html>
  );
} 