'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiMessageSquare, FiClock, FiUser, FiMail, FiChevronRight } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardBody, CardFooter, Divider, Spinner, Button } from '@nextui-org/react';

interface Inquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  createdAt: string;
}

export default function RecentInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/inquiries/recent');
        if (!response.ok) {
          throw new Error('Failed to fetch recent inquiries');
        }
        const data = await response.json();
        setInquiries(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  return (
    <Card className="w-full shadow-lg" shadow="md">
      <CardHeader className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <FiMessageSquare className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Inquiries</h2>
        </div>
        <Button as={Link} href="/admin/inquiries" variant="light" size="sm" className="text-primary">
          View All
        </Button>
      </CardHeader>
      <Divider />
      <CardBody className="p-0">
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <Spinner label="Loading inquiries..." color="primary" />
          </div>
        )}
        {error && <p className="p-4 text-danger text-center">{error}</p>}
        {!isLoading && !error && inquiries.length === 0 && (
          <p className="p-8 text-center text-gray-500">No recent inquiries found.</p>
        )}
        {!isLoading && !error && inquiries.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Link href={`/admin/inquiries?id=${inquiry.id}`} passHref>
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-900 dark:text-white truncate" title={inquiry.subject}>
                        {inquiry.subject}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <div className="flex items-center gap-1.5" title="Name">
                          <FiUser className="h-4 w-4" />
                          <span>{inquiry.customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Time">
                          <FiClock className="h-4 w-4" />
                          <span>{formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <FiChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
       {inquiries.length > 0 && (
        <>
            <Divider />
            <CardFooter className="p-2 justify-center">
                 <Button as={Link} href="/admin/inquiries" variant="light" size="sm" className="text-primary">
                    View All Inquiries
                </Button>
            </CardFooter>
        </>
      )}
    </Card>
  );
} 