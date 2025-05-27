'use client';

import { ArrowLeftIcon, BanknotesIcon, CreditCardIcon,DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Placeholder Invoice type - replace with actual Prisma model when ready
interface PlaceholderInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  service: string;
}

export default function InvoicesPage() {
  // Placeholder data - replace with actual data fetching when API is ready
  const invoices: PlaceholderInvoice[] = [
    // { id: '1', invoiceNumber: 'INV-2024-001', date: '2024-07-01', dueDate: '2024-07-15', amount: 150.00, status: 'Paid', service: 'Leaky Faucet Repair' },
    // { id: '2', invoiceNumber: 'INV-2024-002', date: '2024-07-10', dueDate: '2024-07-24', amount: 320.50, status: 'Unpaid', service: 'Drywall Patching & Painting' },
    // { id: '3', invoiceNumber: 'INV-2024-003', date: '2024-06-15', dueDate: '2024-06-30', amount: 85.00, status: 'Overdue', service: 'Shelf Installation' },
  ];

  const getStatusClass = (status: PlaceholderInvoice['status']) => {
    if (status === 'Paid') return 'bg-green-500/20 text-green-400';
    if (status === 'Unpaid') return 'bg-yellow-500/20 text-yellow-400';
    if (status === 'Overdue') return 'bg-red-500/20 text-red-400';
    return 'bg-slate-600/20 text-slate-400';
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between pb-6 border-b border-slate-700">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-slate-50">My Invoices</h1>
        </div>
        <Link href="/portal" className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-500 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </header>

      {invoices.length === 0 ? (
        <div className="text-center py-10 bg-slate-800 rounded-lg shadow">
          <DocumentTextIcon className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">No Invoices Yet</h2>
          <p className="text-slate-400">
            You currently have no invoices. When you have outstanding or past invoices, they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Invoice #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Service</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.service}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">${invoice.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {invoice.status === 'Unpaid' || invoice.status === 'Overdue' ? (
                      <button disabled className="text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        Pay Now (Soon)
                      </button>
                    ) : (
                      <span className="text-slate-500">View Details</span> // Or link to a detailed view
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Information Placeholder */}
      <div className="mt-8 pt-6 border-t border-slate-700">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Payment Information</h2>
        <p className="text-slate-400 mb-4">
          Secure payment processing will be available here. We plan to support major credit/debit cards and ACH transfers.
        </p>
        <div className="flex space-x-4">
          <CreditCardIcon className="h-8 w-8 text-slate-500" title="Credit/Debit Cards" />
          <BanknotesIcon className="h-8 w-8 text-slate-500" title="ACH Transfers" />
        </div>
      </div>

    </div>
  );
} 