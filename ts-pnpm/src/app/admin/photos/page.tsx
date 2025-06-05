"use client";

import { ApprovalStatus, MaintenanceWorker,Photo, PhotoSet, User } from '@prisma/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect,useState } from 'react';

interface PhotoSetWithDetailsAndWorkerUser extends PhotoSet {
  photos: Photo[];
  maintenanceWorker: (MaintenanceWorker & { user: User | null }) | null;
  customer: User | null;
}

export default function AdminPhotoManagementPage() {
  const router = useRouter();
  const [photoSets, setPhotoSets] = useState<PhotoSetWithDetailsAndWorkerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPhotoSet, setSelectedPhotoSet] = useState<PhotoSetWithDetailsAndWorkerUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAdminPhotoSets = async (page = 1, search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '9');
      if (search) {
        params.append('searchTerm', search);
      }

      const response = await fetch(`/api/admin/photosets?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch photo sets: ${response.statusText}`);
      }
      const result = await response.json();
      setPhotoSets(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setCurrentPage(result.pagination?.page || 1);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setPhotoSets([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPhotoSets(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchAdminPhotoSets(1, searchTerm);
  };

  const openPhotoSetModal = (photoSet: PhotoSetWithDetailsAndWorkerUser) => {
    setSelectedPhotoSet(photoSet);
    setIsModalOpen(true);
  };

  const closePhotoSetModal = () => {
    setIsModalOpen(false);
    setSelectedPhotoSet(null);
  };
  
  const handleApprovePhotoSet = async (photoSetId: string) => {
    try {
      const response = await fetch(`/api/admin/photosets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoSetId, newStatus: ApprovalStatus.APPROVED }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to approve photo set');
      }
      const updatedPhotoSet = await response.json();
      setPhotoSets(prev => prev.map(ps => ps.id === photoSetId ? { ...ps, ...updatedPhotoSet } : ps));
      if (selectedPhotoSet && selectedPhotoSet.id === photoSetId) {
        setSelectedPhotoSet(prev => prev ? { ...prev, ...updatedPhotoSet } : null);
      }
    } catch (err) {
      console.error("Error approving photo set:", err);
      alert(`Error: ${err instanceof Error ? err.message : 'Could not approve photo set'}`);
    }
  };

  const handleRejectPhotoSet = async (photoSetId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/photosets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoSetId, 
          newStatus: ApprovalStatus.REJECTED, 
          description: reason
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject photo set');
      }
      const updatedPhotoSet = await response.json();
      setPhotoSets(prev => prev.map(ps => ps.id === photoSetId ? { ...ps, ...updatedPhotoSet } : ps));
      if (selectedPhotoSet && selectedPhotoSet.id === photoSetId) {
        setSelectedPhotoSet(prev => prev ? { ...prev, ...updatedPhotoSet } : null);
      }
      closePhotoSetModal();
    } catch (err) {
      console.error("Error rejecting photo set:", err);
      alert(`Error: ${err instanceof Error ? err.message : 'Could not reject photo set'}`);
    }
  };

  const getStatusColor = (status: ApprovalStatus | undefined | null) => {
    switch (status) {
      case ApprovalStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case ApprovalStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-300';
      case ApprovalStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-slate-50 min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Photo Management</h1>
            <p className="text-slate-600">Review and manage photos uploaded by maintenance staff for work orders.</p>
        </div>
        <Link href="/admin/dashboard" className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700">
          Back to Admin Dashboard
        </Link>
      </header>

      <form onSubmit={handleSearchSubmit} className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-grow">
            <label htmlFor="searchPhotos" className="block text-sm font-medium text-slate-700 mb-1">Search Photo Sets</label>
            <input
              type="text"
              id="searchPhotos"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by title, worker, work order ID..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Search
          </button>
        </div>
      </form>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">Error: {error}</div>}

      {isLoading && photoSets.length === 0 && <div className="text-center py-10 text-slate-500">Loading photo sets...</div>}
      {!isLoading && photoSets.length === 0 && !error && (
        <div className="text-center py-10 text-slate-500">
          <p className="text-xl">No photo sets found.</p>
          <p>Try adjusting your search criteria or wait for maintenance staff to upload photos.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photoSets.map((ps) => (
          <div key={ps.id} className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 flex-grow">
              <h3 className="text-lg font-semibold text-slate-800 truncate mb-1" title={ps.title ?? undefined}>{ps.title}</h3>
              <p className="text-sm text-slate-600 mb-1">Customer: <span className="font-medium">{ps.customer?.name || ps.customer?.email || ps.customerId || 'N/A'}</span></p>
              <p className="text-sm text-slate-600 mb-2">Uploaded by: <span className="font-medium">{ps.maintenanceWorker?.user?.name || ps.maintenanceWorker?.name || ps.maintenanceWorker?.user?.email || 'N/A'}</span></p>
              <div className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(ps.status)} mb-3`}>
                {ps.status?.replace('_', ' ') || 'UNKNOWN'}
              </div>
              <p className="text-xs text-slate-500">Photos: {ps.photos.length}</p>
              <div className="text-sm text-gray-500">
                {new Date(ps.submittedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button 
                onClick={() => openPhotoSetModal(ps)}
                className="w-full px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                View Details & Approve/Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && !isLoading && (
         <div className="mt-8 py-4 flex justify-center items-center space-x-2 border-t border-slate-200">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && selectedPhotoSet && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out" onClick={closePhotoSetModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 relative transform transition-all duration-300 ease-in-out scale-100" onClick={(e) => e.stopPropagation()}>
            <button onClick={closePhotoSetModal} className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 text-2xl">&times;</button>
            
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-3 mb-4">{selectedPhotoSet.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Customer:</span> {selectedPhotoSet.customer?.name || selectedPhotoSet.customer?.email || selectedPhotoSet.customerId || 'N/A'}</div>
              <div><span className="font-semibold">Uploaded By:</span> {selectedPhotoSet.maintenanceWorker?.user?.name || selectedPhotoSet.maintenanceWorker?.name || 'N/A'} ({selectedPhotoSet.maintenanceWorker?.user?.email || 'N/A'})</div>
              <div><span className="font-semibold">Set Upload Date:</span> {new Date(selectedPhotoSet.submittedAt).toLocaleString()}</div>
              <div className={`font-semibold px-2 py-1 rounded-full border text-xs inline-block ${getStatusColor(selectedPhotoSet.status)}`}>
                Status: {selectedPhotoSet.status?.replace('_',' ') || 'UNKNOWN'}
              </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-700 mt-4 mb-2">Photos ({selectedPhotoSet.photos.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 max-h-[40vh] overflow-y-auto p-2 bg-slate-50 rounded">
              {selectedPhotoSet.photos.map(photo => (
                <div key={photo.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                  <img src={photo.url} alt={`Photo ${photo.id} - ${photo.type}`} className="w-full h-40 object-cover" />
                  <div className="p-3">
                    <p className="text-xs text-slate-600">Type: {photo.type}</p>
                    <p className="text-xs text-slate-500 mt-1">Uploaded: {new Date(photo.uploadedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedPhotoSet.status === ApprovalStatus.PENDING && (
              <div className="border-t pt-4 space-y-3">
                <h3 className="text-lg font-semibold text-slate-700">Actions</h3>
                <button 
                  onClick={() => handleApprovePhotoSet(selectedPhotoSet.id)}
                  className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Approve All Photos in Set
                </button>
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700 mb-1">Reason for Rejection (if rejecting):</label>
                  <textarea 
                    id="rejectionReason" 
                    rows={2} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., Photos are blurry, incorrect angle..."
                  />
                  <button 
                    onClick={() => {
                      const reason = (document.getElementById('rejectionReason') as HTMLTextAreaElement)?.value;
                      if (!reason && selectedPhotoSet.status === ApprovalStatus.PENDING) {
                        alert('Please provide a reason for rejection.');
                        return;
                      }
                      handleRejectPhotoSet(selectedPhotoSet.id, reason || 'No reason provided.');
                    }}
                    className="w-full mt-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Reject All Photos in Set
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 