'use client';

import { CreditCardIcon } from '@heroicons/react/24/outline';
import { DollarSignIcon, EyeIcon } from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

// Mock data - replace with actual data fetching later
const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "2024-05-15",
    amount: 150.00,
    status: "Paid",
    service: "Basic Plumbing Repair",
  },
  {
    id: "INV-2024-002",
    date: "2024-05-20",
    amount: 320.50,
    status: "Pending",
    service: "Electrical Fixture Installation",
  },
  {
    id: "INV-2024-003",
    date: "2024-04-10",
    amount: 85.00,
    status: "Paid",
    service: "Drywall Patching",
  },
  {
    id: "INV-2024-004",
    date: "2024-05-28",
    amount: 500.00,
    status: "Due",
    service: "Custom Carpentry Work",
  },
];

export default function InvoicesPage() {
  return (
    <div className="flex flex-col space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-3">
            <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
            <CardTitle className="text-2xl font-semibold">Invoices</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-6">
            View your past invoices, check payment statuses, and download them for your records. Payment functionality will be available soon.
          </CardDescription>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell className="truncate max-w-xs">{invoice.service}</TableCell>
                    <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Pending' ? 'secondary' : 'destructive'}
                        className={`${invoice.status === 'Paid' ? 'bg-green-500/20 text-green-700 dark:bg-green-700/30 dark:text-green-300' 
                                      : invoice.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' 
                                      : 'bg-red-500/20 text-red-700 dark:bg-red-700/30 dark:text-red-300'}`}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" title="View Details (Coming Soon)" disabled>
                        <EyeIcon className="h-4 w-4 mr-1" /> View
                      </Button>
                      {invoice.status !== 'Paid' && (
                        <Button variant="default" size="sm" title="Pay Invoice (Coming Soon)" disabled>
                          <DollarSignIcon className="h-4 w-4 mr-1" /> Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 