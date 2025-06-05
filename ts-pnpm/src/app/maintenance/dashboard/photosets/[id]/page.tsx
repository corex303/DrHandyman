'use client';

import { ApprovalStatus, Photo, PhotoSet, PhotoType } from '@prisma/client'; // Added PhotoType
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import Button from '@/components/buttons/Button';
import PhotoSetGallery from '@/components/maintenance/PhotoSetGallery'; // Import the gallery

// Interface for the PhotoSet with included photos
interface PhotoSetWithFullPhotos extends PhotoSet {
  photos: Photo[];
  maintenanceWorker?: { id: string; name: string; }; // Updated interface
}

export default function PhotoSetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [photoSet, setPhotoSet] = useState<PhotoSetWithFullPhotos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false); // State for gallery

  // State for editing title and description
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [detailUpdateMessage, setDetailUpdateMessage] = useState<string | null>(null);
  const [detailUpdateError, setDetailUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchPhotoSetDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // We need a new API endpoint to fetch a single photoset with ALL its photos
          const response = await fetch(`/api/maintenance/photo-sets/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch photo set details: ${response.status}`);
          }
          const data = await response.json();
          setPhotoSet(data);
          // Initialize editable fields when data is fetched
          setEditableTitle(data.title || "");
          setEditableDescription(data.description || "");
        } catch (err: any) {
          console.error(`Error fetching photo set ${id}:`, err);
          setError(err.message || "An unknown error occurred.");
        }
        setIsLoading(false);
      };
      fetchPhotoSetDetails();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus: ApprovalStatus) => {
    if (!photoSet) return;
    setIsUpdatingStatus(true);
    setStatusUpdateMessage(null);
    setStatusUpdateError(null);
    try {
      const response = await fetch(`/api/maintenance/photo-sets/${photoSet.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status to ${newStatus}`);
      }
      const updatedPhotoSet = await response.json();
      setPhotoSet(updatedPhotoSet); // Update local state with the new photoSet data
      setStatusUpdateMessage(`Status successfully updated to ${newStatus}.`);
    } catch (err: any) {
      console.error(`Error updating status for photo set ${photoSet.id}:`, err);
      setStatusUpdateError(err.message || "An unknown error occurred while updating status.");
    }
    setIsUpdatingStatus(false);
  };

  const handleDetailUpdate = async () => {
    if (!photoSet) return;
    setIsEditingDetails(true); // Keep in edit mode for feedback, or set to false on success
    setDetailUpdateMessage(null);
    setDetailUpdateError(null);

    const payload: { title?: string; description?: string } = {};
    if (editableTitle !== photoSet.title) payload.title = editableTitle;
    if (editableDescription !== photoSet.description) payload.description = editableDescription;

    if (Object.keys(payload).length === 0) {
      setDetailUpdateMessage("No changes to save.");
      setIsEditingDetails(false);
      return;
    }

    try {
      const response = await fetch(`/api/maintenance/photo-sets/${photoSet.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update details');
      }
      const updatedPhotoSet = await response.json();
      setPhotoSet(updatedPhotoSet); // Update local state
      setEditableTitle(updatedPhotoSet.title || "");
      setEditableDescription(updatedPhotoSet.description || "");
      setDetailUpdateMessage('Details updated successfully!');
      setIsEditingDetails(false); // Exit edit mode on success
    } catch (err: any) {
      console.error('Error updating details:', err);
      setDetailUpdateError(err.message || 'An unknown error occurred.');
      // Optionally, keep isEditingDetails true to allow user to retry or see error
    }
  };

  const cancelEditDetails = () => {
    setEditableTitle(photoSet?.title || "");
    setEditableDescription(photoSet?.description || "");
    setIsEditingDetails(false);
    setDetailUpdateError(null);
    setDetailUpdateMessage(null);
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return 'text-green-500';
      case ApprovalStatus.PENDING:
        return 'text-yellow-500';
      case ApprovalStatus.REJECTED:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><p>Loading photo set details...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4"><p className="text-red-500 text-xl">Error: {error}</p><Link href="/maintenance/dashboard"><Button variant='outline' className='mt-4'>Back to Dashboard</Button></Link></div>;
  }

  if (!photoSet) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4"><p>Photo set not found.</p><Link href="/maintenance/dashboard"><Button variant='outline' className='mt-4'>Back to Dashboard</Button></Link></div>;
  }

  const beforePhotos = photoSet.photos.filter(p => p.type === PhotoType.BEFORE);
  const afterPhotos = photoSet.photos.filter(p => p.type === PhotoType.AFTER);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-5xl mx-auto bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-slate-700">
          <Link href="/maintenance/dashboard" className="text-sky-400 hover:text-sky-300 transition-colors text-sm">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-400 mt-2 mb-1">Photo Set Details</h1>
          <p className="text-sm text-slate-400">Submission ID: {photoSet.id}</p>
          <Button 
            variant='primary' 
            className='mt-2 bg-sky-500 hover:bg-sky-600 text-white'
            onClick={() => setIsGalleryOpen(true)}
          >
            Open Photo Gallery
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-amber-400 mb-2">Submission Info</h2>
            <div className="space-y-2 text-slate-300">
              {isEditingDetails ? (
                <>
                  <div>
                    <label htmlFor="editableTitle" className="block text-sm font-medium text-sky-300 mb-1">Title:</label>
                    <input 
                      type="text" 
                      id="editableTitle"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editableDescription" className="block text-sm font-medium text-sky-300 mb-1">Description:</label>
                    <textarea 
                      id="editableDescription"
                      value={editableDescription}
                      onChange={(e) => setEditableDescription(e.target.value)}
                      rows={3}
                      className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p><strong>Title:</strong> {photoSet.title || 'N/A'}</p>
                  {photoSet.description && <p><strong>Description:</strong> {photoSet.description}</p>}
                </>
              )}
              <p><strong>Service Category:</strong> {photoSet.serviceCategory}</p>
              <p><strong>Submitted:</strong> {new Date(photoSet.submittedAt).toLocaleString()}</p>
              <p><strong>Status:</strong> <span className={`font-semibold ${getStatusColor(photoSet.status)}`}>{photoSet.status}</span></p>
              {photoSet.maintenanceWorker && <p><strong>Worker:</strong> {photoSet.maintenanceWorker.name || 'N/A'}</p>}
            </div>
            <div className="mt-3 space-x-2">
              {isEditingDetails ? (
                <>
                  <Button onClick={handleDetailUpdate} variant="primary" size="sm" className="bg-green-500 hover:bg-green-600">Save Details</Button>
                  <Button onClick={cancelEditDetails} variant="outline" size="sm" className="border-slate-500 text-slate-300 hover:bg-slate-600">Cancel</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditingDetails(true)} variant="outline" size="sm" className="border-sky-500 text-sky-400 hover:bg-sky-600">Edit Details</Button>
              )}
            </div>
            {detailUpdateMessage && <p className="text-xs text-green-400 mt-2">{detailUpdateMessage}</p>}
            {detailUpdateError && <p className="text-xs text-red-400 mt-2">Error: {detailUpdateError}</p>}
          </div>
           {/* Placeholder for Admin Actions like Approve/Reject - Implement later */}
          <div className="md:text-right">
            <h2 className="text-xl font-semibold text-amber-400 mb-2">Admin Actions</h2>
            <div className="space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row md:justify-end">
                <Button 
                  variant='outline' 
                  className='border-green-500 text-green-500 hover:bg-green-600 disabled:opacity-50'
                  onClick={() => handleStatusUpdate(ApprovalStatus.APPROVED)}
                  disabled={isUpdatingStatus || photoSet.status === ApprovalStatus.APPROVED}
                >
                  {isUpdatingStatus ? 'Approving...' : 'Approve Submission'}
                </Button>
                <Button 
                  variant='outline' 
                  className='border-red-500 text-red-500 hover:bg-red-600 disabled:opacity-50'
                  onClick={() => handleStatusUpdate(ApprovalStatus.REJECTED)}
                  disabled={isUpdatingStatus || photoSet.status === ApprovalStatus.REJECTED}
                >
                  {isUpdatingStatus ? 'Rejecting...' : 'Reject Submission'}
                </Button>
            </div>
            {statusUpdateMessage && <p className="text-xs text-green-400 mt-2 md:text-right">{statusUpdateMessage}</p>}
            {statusUpdateError && <p className="text-xs text-red-400 mt-2 md:text-right">Error: {statusUpdateError}</p>}
            {photoSet.status !== ApprovalStatus.PENDING && <p className='text-xs text-slate-500 mt-2 md:text-right'>This submission has already been reviewed.</p>}
          </div>
        </div>

        <div>
          <section className="mb-8">
            <h3 className="text-2xl font-semibold text-sky-300 mb-4">Before Photos ({beforePhotos.length})</h3>
            {beforePhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {beforePhotos.map(photo => (
                  <div key={photo.id} className="block aspect-square bg-slate-700 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
                    <img src={photo.url} alt={`Before - ${photoSet.title || photoSet.id}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-400">No before photos submitted.</p>}
          </section>

          <section>
            <h3 className="text-2xl font-semibold text-sky-300 mb-4">After Photos ({afterPhotos.length})</h3>
            {afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {afterPhotos.map(photo => (
                  <div key={photo.id} className="block aspect-square bg-slate-700 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
                    <img src={photo.url} alt={`After - ${photoSet.title || photoSet.id}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-400">No after photos submitted.</p>}
          </section>
        </div>
        
      </div>
      {photoSet && (
        <PhotoSetGallery 
          photoSetId={photoSet.id} 
          open={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
} 