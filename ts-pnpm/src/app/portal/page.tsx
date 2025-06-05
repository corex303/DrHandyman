'use client';

import { ArrowPathIcon, CalendarIcon,ChatBubbleLeftEllipsisIcon, CreditCardIcon, EyeIcon, InformationCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface DashboardCardProps {
  title: string;
  description: string;
  linkHref?: string;
  linkText?: string;
  icon: React.ElementType;
  comingSoon?: boolean;
  action?: () => void;
}

const Card: React.FC<DashboardCardProps> = ({ title, description, linkHref, linkText, icon: Icon, comingSoon, action }) => (
  <div className="bg-slate-700/50 p-6 rounded-xl shadow-lg hover:shadow-slate-600/30 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
    <div className="flex items-center mb-3">
      <Icon className="h-7 w-7 text-primary-400 mr-3" />
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
    </div>
    <p className="text-slate-400 mb-4 text-sm leading-relaxed min-h-[40px]">{description}</p>
    {linkHref && linkText && !comingSoon && (
      <Link href={linkHref} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors">
        {linkText}
        <EyeIcon className="h-4 w-4 ml-2" />
      </Link>
    )}
    {action && linkText && !comingSoon && (
      <button 
        onClick={action}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
      >
        {linkText}
      </button>
    )}
    {comingSoon && linkText && (
      <button 
        disabled 
        className="inline-flex items-center px-4 py-2 bg-slate-600 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed"
      >
        {linkText} (Soon)
      </button>
    )}
  </div>
);

export default function CustomerPortalDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <ArrowPathIcon className="h-8 w-8 text-primary-400 animate-spin mr-3" />
        <p className="text-lg text-slate-300">Loading dashboard...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session || !session.user) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-800 p-6 rounded-lg shadow-xl">
            <InformationCircleIcon className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-xl text-red-400 mb-3">Access Denied</p>
            <p className="text-slate-300 mb-6 text-center">You must be signed in to view this page.</p>
            <Link href="/auth/signin?callbackUrl=/portal" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors">
                Sign In
            </Link>
        </div>
    );
  }

  const dashboardCards: DashboardCardProps[] = [
    {
      title: 'View Your Bookings',
      description: 'Check the status of your upcoming and past handyman services. Manage appointments here.',
      linkHref: '/portal/bookings',
      linkText: 'My Bookings',
      icon: CalendarIcon,
      comingSoon: false, 
    },
    {
      title: 'Messages & Support',
      description: 'Communicate with our team, ask questions, and get help directly from our Service Technicians.',
      linkHref: '/portal/chat',
      linkText: 'Open Chat',
      icon: ChatBubbleLeftEllipsisIcon,
      comingSoon: false,

    },
    {
      title: 'View Invoices',
      description: 'Access your billing history and manage payments.',
      icon: CreditCardIcon,
      linkHref: '/portal/invoices',
      linkText: 'Go to Invoices',
      comingSoon: false,
    },
    {
      title: 'Manage Your Profile',
      description: 'Keep your contact information, preferences, and payment methods up to date.',
      linkHref: '/portal/profile',
      linkText: 'Edit Profile',
      icon: UserCircleIcon,
      comingSoon: false,
    },
  ];

  return (
    <div className="space-y-10">
      <header className="pb-6 border-b border-slate-700">
        <h1 className="text-4xl font-bold text-slate-50 mb-2">
          Welcome, {session.user.name || session.user.email}!
        </h1>
        <p className="text-lg text-slate-400">
          This is your Dr. Handyman portal. Here's a quick overview.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-primary-400 mb-6">Your Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {dashboardCards.map((card) => (
            <Card key={card.title} {...card} />
          ))}
        </div>
      </section>
      
    </div>
  );
} 