'use client'; // Required for useRouter and event handlers

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For redirection after logout
import { useEffect, useState } from 'react';
import { FiBriefcase,FiCheckCircle, FiDollarSign, FiEdit, FiEye, FiImage, FiLayers, FiMessageSquare, FiSettings, FiTool, FiUsers } from 'react-icons/fi'; // Importing some icons

import Button from '@/components/buttons/Button'; // Assuming Button component exists

// Placeholder for FiLogOut icon if not already available
// It's good practice to define icons or ensure they are imported correctly.
const FiLogOut = (props: any) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

interface PendingReviewStats {
  count: number;
  isLoading: boolean;
  error: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();

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
  const pendingApprovalsCount = 3; // Replace with actual data fetching

  const [pendingPortfolioCount, setPendingPortfolioCount] = useState<PendingReviewStats>({ count: 0, isLoading: true, error: null });

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

  // Dummy data for now - replace with actual data fetching
  const stats = [
    { name: 'Total Users', stat: '1,200', icon: FiUsers, href: '/admin/users' },
    { name: 'Active Services', stat: '15', icon: FiLayers, href: '/admin/services' },
    { name: 'Total Revenue', stat: '$25,650', icon: FiDollarSign, href: '/admin/billing' },
    { name: 'Pending Portfolio Items', stat: '3', icon: FiEye, href: '/admin/portfolio?status=PENDING' }, // Example
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 max-w-6xl w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-0">Admin Dashboard</h1>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="border-red-500 text-red-500 hover:bg-red-50 flex items-center space-x-2"
          >
            <FiLogOut className="h-5 w-5" /> 
            <span>Logout</span>
          </Button>
        </div>

        {/* Activity Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ActivityWidget
            title="Recent Inquiries"
            count={recentInquiriesCount}
            linkHref="/admin/inquiries" // Task 20
            linkText="View All Inquiries"
            icon={<FiMessageSquare className="text-3xl text-cyan-500" />}
            bgColor="bg-cyan-50"
            borderColor="border-cyan-500"
          />
          <ActivityWidget
            title="Portfolio Approvals"
            count={pendingApprovalsCount}
            linkHref="/admin/portfolio/approvals" // Task 16
            linkText="Manage Approvals"
            icon={<FiCheckCircle className="text-3xl text-amber-500" />}
            bgColor="bg-amber-50"
            borderColor="border-amber-500"
          />
        </div>

        {/* Pending Portfolio Items Notice */}
        {pendingPortfolioCount.isLoading && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md shadow" role="alert">
            <p className="font-bold">Loading Pending Portfolio Items...</p>
          </div>
        )}
        {!pendingPortfolioCount.isLoading && pendingPortfolioCount.error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
            <p className="font-bold">Error Loading Pending Items</p>
            <p>{pendingPortfolioCount.error}</p>
          </div>
        )}
        {!pendingPortfolioCount.isLoading && !pendingPortfolioCount.error && pendingPortfolioCount.count > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow hover:shadow-lg transition-shadow duration-300" role="alert">
            <div className="flex items-center">
              <FiImage className="text-2xl mr-3" />
              <div>
                <p className="font-bold">Portfolio Items Awaiting Review</p>
                <p>
                  There are currently <span className="font-semibold">{pendingPortfolioCount.count}</span> photo set(s) pending your approval.
                  <Link href="/admin/portfolio?status=PENDING" className="ml-2 underline hover:text-yellow-800 font-medium">
                    Review Them Now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
        {!pendingPortfolioCount.isLoading && !pendingPortfolioCount.error && pendingPortfolioCount.count === 0 && (
           <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow" role="alert">
            <div className="flex items-center">
              <FiCheckCircle className="text-2xl mr-3" />
              <div>
                <p className="font-bold">Portfolio Queue Clear!</p>
                <p>There are no photo sets currently awaiting review.</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Management Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Site Appearance"
            description="Manage themes, colors, fonts, and general site look and feel."
            linkHref="/admin/appearance/general"
            linkText="Manage Appearance"
            icon={<FiEdit className="text-2xl text-purple-600" />}
            bgColor="bg-purple-50"
            titleColor="text-purple-700"
            borderColor="border-purple-500"
          />
          <DashboardCard
            title="Content Management"
            description="Edit content for pages like About Us, FAQ, and services."
            linkHref="/admin/content" // Task 17 / 32
            linkText="Manage Content"
            icon={<FiEye className="text-2xl text-teal-600" />}
            bgColor="bg-teal-50"
            titleColor="text-teal-700"
            borderColor="border-teal-500"
          />
          <DashboardCard
            title="Chat & Messages"
            description="View and manage conversations with customers and staff."
            linkHref="/admin/chat"
            linkText="Open Chat"
            icon={<FiMessageSquare className="text-2xl text-blue-600" />} 
            bgColor="bg-blue-50"
            titleColor="text-blue-700"
            borderColor="border-blue-500"
          />
          <DashboardCard
            title="Payments & Billing"
            description="Manage invoices, view transaction history, and configure payment settings."
            linkHref="/admin/billing" // New link for Payments/Billing
            linkText="Manage Billing"
            icon={<FiDollarSign className="text-2xl text-green-600" />} // Suggesting FiDollarSign, ensure it's imported
            bgColor="bg-green-50"
            titleColor="text-green-700"
            borderColor="border-green-500"
          />
          <DashboardCard
            title="Photo Portfolio"
            description="Review and manage all worker-uploaded photos for the public portfolio."
            linkHref="/admin/portfolio" // Task 16
            linkText="Manage Portfolio"
            icon={<FiImage className="text-2xl text-orange-600" />}
            bgColor="bg-orange-50"
            titleColor="text-orange-700"
            borderColor="border-orange-500"
          />
          <DashboardCard
            title="Services Offered"
            description="Define and manage the handyman services listed on the site."
            linkHref="/admin/services" // Task 15
            linkText="Manage Services"
            icon={<FiTool className="text-2xl text-pink-600" />}
            bgColor="bg-pink-50"
            titleColor="text-pink-700"
            borderColor="border-pink-500"
          />
           <DashboardCard
            title="Global Settings"
            description="Configure global site parameters, integrations, and API keys."
            linkHref="/admin/settings" // Task 21 / 28 
            linkText="Manage Settings"
            icon={<FiSettings className="text-2xl text-indigo-600" />}
            bgColor="bg-indigo-50"
            titleColor="text-indigo-700"
            borderColor="border-indigo-500"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((item) => (
            <Link key={item.name} href={item.href}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">{item.name}</h3>
                    <item.icon className="text-2xl text-indigo-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{item.stat}</p>
                </div>
                <p className="text-sm text-indigo-600 hover:underline mt-4">View Details</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Link href="/admin/portfolio/upload" className="block p-6 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 text-center">
              <FiBriefcase className="text-3xl mx-auto mb-2"/>
              <h3 className="font-semibold text-lg">Manage Portfolio</h3>
              <p className="text-sm opacity-90">Approve, edit, or directly upload items.</p>
          </Link>
          <Link href="/admin/services" className="block p-6 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition-colors duration-300 text-center">
              <FiLayers className="text-3xl mx-auto mb-2"/>
              <h3 className="font-semibold text-lg">Manage Services</h3>
              <p className="text-sm opacity-90">Add, edit, or remove service offerings.</p>
          </Link>
          <Link href="/admin/settings" className="block p-6 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-300 text-center">
              <FiUsers className="text-3xl mx-auto mb-2"/> {/* Using FiUsers as a placeholder for settings */} 
              <h3 className="font-semibold text-lg">Site Settings</h3>
              <p className="text-sm opacity-90">Configure appearance, content, etc.</p>
          </Link>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Dr. Handyman Admin Panel
          </p>
        </div>
      </div>
    </div>
  );
}

interface ActivityWidgetProps {
  title: string;
  count: number;
  linkHref: string;
  linkText: string;
  icon: React.ReactNode;
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
  icon: React.ReactNode;
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