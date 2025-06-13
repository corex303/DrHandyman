'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiImage, FiClock, FiUser, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardBody, CardFooter, Divider, Spinner, Button, Pagination, Image } from '@nextui-org/react';

interface Photo {
  id: string;
  url: string;
}

interface MaintenanceWorker {
  name: string | null;
}

interface PhotoSet {
  id: string;
  title: string | null;
  submittedAt: string;
  maintenanceWorker: MaintenanceWorker;
  photos: Photo[];
}

interface ApiResponse {
  data: PhotoSet[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function PendingApprovals() {
  const [approvals, setApprovals] = useState<PhotoSet[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/portfolio-approvals?page=${page}&limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
      }
      const data: ApiResponse = await response.json();
      setApprovals(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchApprovals(newPage);
  };

  return (
    <Card className="w-full shadow-lg" shadow="md">
      <CardHeader className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <FiImage className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pending Approvals</h2>
        </div>
        <Button as={Link} href="/admin/portfolio" variant="light" size="sm" className="text-primary">
          View All
        </Button>
      </CardHeader>
      <Divider />
      <CardBody className="p-0">
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <Spinner label="Loading approvals..." color="primary" />
          </div>
        )}
        {error && (
            <div className="p-4 text-danger text-center flex flex-col items-center gap-2">
                <FiAlertCircle className="h-8 w-8 text-danger-500" />
                <span>{error}</span>
            </div>
        )}
        {!isLoading && !error && approvals.length === 0 && (
          <p className="p-8 text-center text-gray-500">No pending approvals found.</p>
        )}
        {!isLoading && !error && approvals.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {approvals.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/portfolio?photoset_id=${item.id}`} passHref>
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <div className="flex items-center gap-4">
                        {item.photos.length > 0 ? (
                           <Image
                                src={item.photos[0].url}
                                alt={item.title || 'Portfolio item thumbnail'}
                                width={64}
                                height={64}
                                className="object-cover rounded-md"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                                <FiImage className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-900 dark:text-white truncate" title={item.title || 'Untitled'}>
                                {item.title || 'Untitled Photo Set'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <div className="flex items-center gap-1.5" title="Worker">
                                <FiUser className="h-4 w-4" />
                                <span>{item.maintenanceWorker?.name || 'Unknown Worker'}</span>
                                </div>
                                <div className="flex items-center gap-1.5" title="Time">
                                <FiClock className="h-4 w-4" />
                                <span>{formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}</span>
                                </div>
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
       {pagination.totalPages > 1 && (
        <>
            <Divider />
            <CardFooter className="p-2 justify-center">
                <Pagination
                    isCompact
                    showControls
                    total={pagination.totalPages}
                    page={pagination.page}
                    onChange={handlePageChange}
                />
            </CardFooter>
        </>
      )}
    </Card>
  );
} 