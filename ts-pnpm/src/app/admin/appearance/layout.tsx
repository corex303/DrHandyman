'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const appearanceTabs = [
  { name: 'General', href: '/admin/appearance/general' },
  { name: 'Colors & Fonts', href: '/admin/appearance/colors-fonts' },
  { name: 'Header & Footer', href: '/admin/appearance/header-footer' },
  { name: 'Homepage Layout', href: '/admin/appearance/homepage' },
];

export default function AppearanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold leading-tight text-gray-900">Appearance Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Customize the look and feel of your website.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {appearanceTabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                ${pathname === tab.href
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
                whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium
              `}
              aria-current={pathname === tab.href ? 'page' : undefined}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="py-6">
        {children}
      </div>
    </div>
  );
} 