'use client'; // Required for useRouter and event handlers

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For redirection after logout
import { ReactNode, SVGProps,useEffect, useState } from 'react';
import React from 'react';
import { FiBriefcase, FiCheckCircle, FiDollarSign, FiImage, FiLayers, FiTool, FiUsers } from 'react-icons/fi'; // FiEdit, FiSettings removed as they became unused with placeholders

import Button from '@/components/buttons/Button';
import WrappedReactIcon from '@/components/ui/WrappedReactIcon';
import RecentInquiries from '@/components/admin/RecentInquiries';

const FiLogOut = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

interface ActivityWidgetProps {
  title: string;
  count: number;
  linkHref: string;
  linkText: string;
  icon: ReactNode; // Reverted to ReactNode
  bgColor?: string;
  borderColor?: string;
}

function ActivityWidget({
  title,
  count,
  linkHref,
  linkText,
  icon,
  bgColor = 'bg-gray-50',
  borderColor = 'border-gray-300'
}: ActivityWidgetProps) {
  return (
    <div className={`p-6 rounded-xl shadow-lg ${bgColor} border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        {icon}
      </div>
      <p className="text-4xl font-bold text-gray-800 mb-1">{count}</p>
      <p className="text-sm text-gray-500 mb-4">Items requiring attention</p>
      <Link href={linkHref} passHref>
        <Button variant="outline" className="w-full mt-2" size="sm">
          {linkText}
        </Button>
      </Link>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  icon: ReactNode; // Reverted to ReactNode
  bgColor?: string;
  titleColor?: string;
  borderColor?: string;
}

function DashboardCard({
  title,
  description,
  linkHref,
  linkText,
  icon,
  bgColor = 'bg-gray-50',
  titleColor = 'text-gray-700',
  borderColor = 'border-gray-300'
}: DashboardCardProps) {
  return (
    <div className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ${bgColor} border-l-4 ${borderColor}`}>
      <div className="flex items-center mb-3">
        <div className="p-2 bg-white rounded-full shadow mr-3">
         {icon}
        </div>
        <h2 className={`text-xl font-semibold ${titleColor}`}>{title}</h2>
      </div>
      <p className="text-gray-600 mb-4 text-sm min-h-[3.75rem]">
        {description}
      </p>
      <Link href={linkHref} passHref>
        <Button variant="primary" className="w-full mt-auto" size="sm">{linkText}</Button>
      </Link>
    </div>
  );
}

// Interface for API response data (adjust as per your actual API response)
interface PendingReviewStats {
  count: number;
  isLoading: boolean;
  error: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [pendingMaintenanceCount, setPendingMaintenanceCount] = useState<PendingReviewStats>({ count: 0, isLoading: true, error: null });
  const [pendingServiceCount, setPendingServiceCount] = useState<PendingReviewStats>({ count: 0, isLoading: true, error: null });
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<PendingReviewStats>({ count: 3, isLoading: false, error: null }); // Task 16, Initialized with a default value
  const [pendingPortfolioCount, setPendingPortfolioCount] = useState<PendingReviewStats>({ count: 0, isLoading: true, error: null });

  // Define icons as ReactNode typed variables, using WrappedReactIcon
  const recentInquiriesIcon = <WrappedReactIcon icon={FiBriefcase} className="text-3xl text-cyan-500" />;
  const chatManagementIcon = <WrappedReactIcon icon={FiBriefcase} className="text-2xl text-blue-600" />;
  const pendingMaintenanceIcon = <WrappedReactIcon icon={FiTool} className="text-3xl text-red-500" />;
  const pendingPortfolioReviewIcon = <WrappedReactIcon icon={FiImage} className="text-3xl text-yellow-500" />;
  const servicesManagementIcon = <WrappedReactIcon icon={FiLayers} className="text-2xl text-green-600" />;
  const usersManagementIcon = <WrappedReactIcon icon={FiUsers} className="text-2xl text-indigo-600" />;
  const dollarSignIcon = <WrappedReactIcon icon={FiDollarSign} className="text-2xl text-pink-600" />; // Added for stats
  const imageIconForStats = <WrappedReactIcon icon={FiImage} className="text-2xl text-yellow-600" />; // Added for stats, potentially different style
  // Placeholder for FiEdit
  const contentManagementIcon = (
    <svg viewBox="0 0 24 24" className="text-2xl text-purple-600" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  );
  // Placeholder for FiEye
  const appearanceSettingsIcon = (
    <svg viewBox="0 0 24 24" className="text-2xl text-teal-600" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5S10.62 14.5 12 14.5s2.5-1.12 2.5-2.5S13.38 9.5 12 9.5z"/>
    </svg>
  );
  // Placeholder for FiSettings
  const generalSettingsIcon = (
    <svg viewBox="0 0 24 24" className="text-2xl text-gray-600" fill="currentColor">
      <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17-.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12-.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2 3.46c.13.22.07.49.12.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
    </svg>
  );
  // Placeholder for FiDollarSign
  const billingIcon = (
    <svg viewBox="0 0 24 24" className="text-2xl text-pink-600" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4v2h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-4v-2h4v-1h-2c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2z"/>
    </svg>
  );
  // Placeholder for FiCheckCircle
  const approvalIcon = (
    <svg viewBox="0 0 24 24" className="text-3xl text-amber-500" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );

  const handleLogout = async () => {
    try {
      // We'll need a logout API route for admin, similar to maintenance
      await fetch('/api/admin/logout', { // TODO: Create this API route
        method: 'POST',
      });
    } catch (error) {
      console.error("Failed to logout from admin session", error);
    } finally {
      router.push('/admin/login');
    }
  };

  // Placeholder data for activity widgets
  const recentInquiriesCount = 5; // Replace with actual data fetching
  // const pendingApprovalsCount = 3; // Replace with actual data fetching - REMOVED as it's a state variable

  useEffect(() => {
    const fetchPendingCount = async () => {
      setPendingPortfolioCount(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await fetch('/api/admin/photosets/pending-count');
        if (!response.ok) {
          throw new Error('Failed to fetch pending portfolio count');
        }
        const data = await response.json();
        setPendingPortfolioCount({ count: data.count, isLoading: false, error: null });
      } catch (err) {
        console.error("Error fetching pending portfolio count:", err);
        setPendingPortfolioCount({ count: 0, isLoading: false, error: (err as Error).message });
      }
    };
    fetchPendingCount();
  }, []);

  return (
    <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 w-full">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-200">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RecentInquiries />
        </div>
        <div className="space-y-8">
          {/* Placeholder for other widgets */}
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-700 mt-12 mb-6">Management Sections</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Site Appearance"
          description="Manage themes, colors, fonts, and general site look and feel."
          linkHref="/admin/appearance/general"
          linkText="Manage Appearance"
          icon={generalSettingsIcon}
          bgColor="bg-purple-50"
          titleColor="text-purple-700"
          borderColor="border-purple-500"
        />
        <DashboardCard
          title="Content Management"
          description="Edit content for pages like About Us, FAQ, and services."
          linkHref="/admin/content" // Task 17 / 32
          linkText="Manage Content"
          icon={contentManagementIcon}
          bgColor="bg-teal-50"
          titleColor="text-teal-700"
          borderColor="border-teal-500"
        />
        <DashboardCard
          title="Chat & Messages"
          description="View and manage conversations with customers and staff."
          linkHref="/admin/chat"
          linkText="Open Chat"
          icon={chatManagementIcon}
          bgColor="bg-blue-50"
          titleColor="text-blue-700"
          borderColor="border-blue-500"
        />
        <DashboardCard
          title="Payments & Billing"
          description="Manage invoices, view transaction history, and configure payment settings."
          linkHref="/admin/billing" // New link for Payments/Billing
          linkText="Manage Billing"
          icon={billingIcon}
          bgColor="bg-green-50"
          titleColor="text-green-700"
          borderColor="border-green-500"
        />
        <DashboardCard
          title="Photo Portfolio"
          description="Review and manage all worker-uploaded photos for the public portfolio."
          linkHref="/admin/portfolio" // Task 16
          linkText="Manage Portfolio"
          icon={<WrappedReactIcon icon={FiImage} className="text-2xl text-orange-600" />}
          bgColor="bg-orange-50"
          titleColor="text-orange-700"
          borderColor="border-orange-500"
        />
        <DashboardCard
          title="Services Offered"
          description="Define and manage the handyman services listed on the site."
          linkHref="/admin/services" // Task 15
          linkText="Manage Services"
          icon={servicesManagementIcon}
          bgColor="bg-pink-50"
          titleColor="text-pink-700"
          borderColor="border-pink-500"
        />
        <DashboardCard
          title="Global Settings"
          description="Configure global site parameters, integrations, and API keys."
          linkHref="/admin/settings" // Task 21 / 28 
          linkText="Manage Settings"
          icon={generalSettingsIcon}
          bgColor="bg-indigo-50"
          titleColor="text-indigo-700"
          borderColor="border-indigo-500"
        />
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Dr. Handyman Admin Panel
        </p>
      </div>
    </div>
  );
} 