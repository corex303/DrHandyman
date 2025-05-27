'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

import Breadcrumbs from './Breadcrumbs';

interface PageLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

const PageLayout = ({ children, showBreadcrumbs = true }: PageLayoutProps) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <div className="flex min-h-screen flex-col">
      {showBreadcrumbs && !isHomePage && <Breadcrumbs />}
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default PageLayout; 