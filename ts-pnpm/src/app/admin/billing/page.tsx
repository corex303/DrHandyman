import Link from 'next/link';

export default function AdminBillingPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 max-w-4xl w-full text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">Payments & Billing</h1>
        <p className="text-lg text-gray-600 mb-8">
          This section is under construction. Soon you will be able to manage invoices, view transaction history, and configure billing settings here.
        </p>
        <Link href="/admin/dashboard" passHref>
          <span className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
            &larr; Back to Dashboard
          </span>
        </Link>
      </div>
    </div>
  );
} 