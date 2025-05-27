'use client';

import { ArrowLeftIcon, PencilSquareIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  // Placeholder data - replace with actual data fetching when API is ready
  const userProfile = {
    name: session?.user?.name || 'N/A',
    email: session?.user?.email || 'N/A',
    phone: 'Not set', // Placeholder
    address: 'Not set', // Placeholder
    image: session?.user?.image || undefined,
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-300">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between pb-6 border-b border-slate-700">
        <div className="flex items-center">
          <UserCircleIcon className="h-8 w-8 text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-slate-50">Manage Profile</h1>
        </div>
        <Link href="/portal" className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-500 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </header>

      <div className="bg-slate-800 rounded-lg shadow p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Profile Picture Placeholder */}
          <div className="flex-shrink-0">
            {userProfile.image ? (
              <img src={userProfile.image} alt={userProfile.name} className="h-32 w-32 rounded-full object-cover ring-2 ring-primary-500" />
            ) : (
              <UserCircleIcon className="h-32 w-32 text-slate-500" />
            )}
            <button disabled className="mt-3 w-full text-sm text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed">Change Photo (Soon)</button>
          </div>

          {/* Profile Details */}
          <div className="flex-grow space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400">Full Name</label>
              <p className="mt-1 text-lg text-slate-100 p-2 bg-slate-700/50 rounded-md min-h-[36px]">{userProfile.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400">Email Address</label>
              <p className="mt-1 text-lg text-slate-100 p-2 bg-slate-700/50 rounded-md min-h-[36px]">{userProfile.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400">Phone Number</label>
              <p className="mt-1 text-lg text-slate-100 p-2 bg-slate-700/50 rounded-md min-h-[36px]">{userProfile.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400">Primary Address</label>
              <p className="mt-1 text-lg text-slate-100 p-2 bg-slate-700/50 rounded-md min-h-[36px]">{userProfile.address}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-700 text-right">
          <button 
            disabled 
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-500 transition-colors opacity-50 cursor-not-allowed"
          >
            <PencilSquareIcon className="h-5 w-5 mr-2" />
            Edit Profile (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
} 