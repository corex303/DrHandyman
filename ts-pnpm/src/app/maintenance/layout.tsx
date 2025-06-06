import * as React from 'react';

import { MaintenanceSidebar } from '@/components/layout/MaintenanceSidebar';

interface MaintenanceLayoutProps {
  children: React.ReactNode;
}

export default function MaintenanceLayout({ children }: MaintenanceLayoutProps) {
  return (
    <div className="flex flex-grow">
        <MaintenanceSidebar />
        <main className="flex-grow p-4 sm:p-6 md:p-8 bg-slate-800">
            {children}
        </main>
    </div>
  );
} 