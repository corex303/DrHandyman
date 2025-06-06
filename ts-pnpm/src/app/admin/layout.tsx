import * as React from 'react';

import { AdminSidebar } from '@/components/layout/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex flex-grow">
        <AdminSidebar />
        <main className="flex-grow p-4 sm:p-6 md:p-8 bg-slate-50">
            {children}
        </main>
    </div>
  );
} 