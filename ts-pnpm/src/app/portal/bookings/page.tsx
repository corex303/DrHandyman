'use client';

import { ArrowLeftIcon,CalendarDaysIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function BookingsPage() {
  // Placeholder data - replace with actual data fetching when API is ready
  const bookings = [
    // { id: '1', service: 'Leaky Faucet Repair', date: '2024-07-15', status: 'Scheduled', worker: 'John D.' },
    // { id: '2', service: 'Drywall Patching', date: '2024-06-20', status: 'Completed', worker: 'Jane S.' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between pb-6 border-b border-slate-700">
        <div className="flex items-center">
          <CalendarDaysIcon className="h-8 w-8 text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-slate-50">My Bookings</h1>
        </div>
        <Link href="/portal" className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-500 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </header>

      {bookings.length === 0 ? (
        <div className="text-center py-10 bg-slate-800 rounded-lg shadow">
          <CalendarDaysIcon className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">No Bookings Yet</h2>
          <p className="text-slate-400 mb-6">You currently don't have any scheduled or past bookings.</p>
          <button 
            disabled 
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-500 transition-colors opacity-50 cursor-not-allowed"
          >
            Request New Service (Coming Soon)
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Placeholder for booking list - to be implemented when data model exists */}
          <p className="text-slate-400">Booking list will appear here.</p>
        </div>
      )}
    </div>
  );
} 