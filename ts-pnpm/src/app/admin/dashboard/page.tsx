'use client'; // Required for useRouter and event handlers

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For redirection after logout
import Button from '@/components/buttons/Button'; // Assuming Button component exists
import { FiAlertCircle, FiCheckCircle, FiEdit, FiEye, FiImage, FiMessageSquare, FiSettings, FiTool, FiUsers, FiDollarSign } from 'react-icons/fi'; // Importing some icons

// Placeholder for FiLogOut icon if not already available
// It's good practice to define icons or ensure they are imported correctly.
const FiLogOut = (props: any) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

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