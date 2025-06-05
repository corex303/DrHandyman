'use client';

import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline'; // Using outline icons
import { CalendarDaysIcon, CreditCardIcon, LayoutDashboardIcon, MessageSquareTextIcon, UserCircle2Icon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  current?: boolean;
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Define navigation inside the component so usePathname can be called correctly
  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboardIcon, current: pathname === '/portal' },
    { name: 'My Bookings', href: '/portal/bookings', icon: CalendarDaysIcon, current: pathname === '/portal/bookings', disabled: true }, 
    {
      name: 'Messages',
      href: '/portal/chat',
      icon: MessageSquareTextIcon,
      current: pathname === '/portal/chat' || pathname.startsWith('/portal/chat/'),
    },
    { name: 'Invoices', href: '/portal/invoices', icon: CreditCardIcon, current: pathname === '/portal/invoices', disabled: true },
    { name: 'Profile', href: '/portal/profile', icon: UserCircle2Icon, current: pathname === '/portal/profile', disabled: true },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-lg text-slate-300">Loading portal...</p>
      </div>
    );
  }

  // Redirect unauthenticated users (should be handled by middleware but good as a fallback)
  // Note: useRouter cannot be used at the top level of layout during initial render if unauthenticated.
  // Middleware is the more robust solution for protecting routes.

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 p-6 flex flex-col justify-between shadow-lg">
        <div>
          <div className="mb-10">
            <Link href="/portal" className="flex items-center space-x-3">
              {/* Replace with Dr. Handyman Logo if available */}
              <span className="text-2xl font-bold text-slate-100">Dr. Handyman</span>
            </Link>
            {session?.user?.email && (
              <p className="text-xs text-slate-400 mt-1 truncate" title={session.user.email}>
                {session.user.email}
              </p>
            )}
          </div>
          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg transition-colors
                  ${pathname === item.href && !item.disabled ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-slate-700 hover:text-slate-50'}
                  ${item.disabled ? 'text-slate-500 cursor-not-allowed opacity-60' : 'text-slate-200'}
                `}
                aria-disabled={item.disabled}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
                {item.disabled && <span className="ml-auto text-xs text-slate-500">(Soon)</span>}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-slate-200 hover:bg-red-600 hover:text-white transition-colors group"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0 group-hover:text-white" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 