"use client";

import React, { useCallback,useEffect, useState } from 'react';

import { ApprovalStatus, MaintenanceWorker,Photo, PhotoSet } from '../../../../generated/prisma-client';

// Define a more specific type for PhotoSet with included relations
interface PhotoSetWithRelations extends PhotoSet {
  maintenanceWorker: MaintenanceWorker;
  photos: Photo[];
}

interface MaintenanceWorkerOption {
  id: string;
  name: string;
}

// State for Edit Modal
interface EditingPhotoSetState extends Partial<PhotoSetWithRelations> {
  // Fields that can be edited. Partial to allow for initial empty state or loading.
  // We might only allow editing specific fields like title, description, serviceCategory.
  title?: string;
  description?: string;
  serviceCategory?: string;
  // id is crucial for identifying the photoset to update.
  id?: string;
}

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]; // Added for client-side use

const AdminPortfolioPage = () => {
  const [allPhotoSets, setAllPhotoSets] = useState<PhotoSetWithRelations[]>([]); // Holds all sets for the active tab before further filtering
  const [filteredPhotoSets, setFilteredPhotoSets] = useState<PhotoSetWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ApprovalStatus>(ApprovalStatus.PENDING);

  const [maintenanceWorkers, setMaintenanceWorkers] = useState<MaintenanceWorkerOption[]>([]);
  const [serviceCategoriesForFilter, setServiceCategoriesForFilter] = useState<string[]>([]);

  const [selectedWorker, setSelectedWorker] = useState<string>(''); // Store worker ID
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(''); // Renamed for clarity

  const [sortBy, setSortBy] = useState<string>('submittedAt'); // Default sort by submission date
  const [sortOrder, setSortOrder] = useState<string>('desc'); // Default sort order

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPhotoSet, setEditingPhotoSet] = useState<EditingPhotoSetState | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // State for Direct Admin Upload Form
  const [directUploadTitle, setDirectUploadTitle] = useState("");
  const [directUploadDescription, setDirectUploadDescription] = useState("");
  const [directUploadServiceCategory, setDirectUploadServiceCategory] = useState("");
  const [directUploadBeforeImages, setDirectUploadBeforeImages] = useState<FileList | null>(null);
  const [directUploadAfterImages, setDirectUploadAfterImages] = useState<FileList | null>(null);
  const [directUploadWorkerId, setDirectUploadWorkerId] = useState(""); // For now, admin selects a worker
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const [directUploadMessage, setDirectUploadMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  // State for Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPhotoSetId, setDeletingPhotoSetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch maintenance workers for the filter dropdown
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch('/api/maintenance/workers/active');
        if (!response.ok) {
          throw new Error('Failed to fetch maintenance workers');
        }
        const data: MaintenanceWorkerOption[] = await response.json();
        setMaintenanceWorkers(data);
      } catch (err) {
        console.error("Error fetching workers:", err);
        // Optionally set an error state here for worker fetching
      }
    };
    fetchWorkers();
  }, []);

  // Fetch all available service categories for the filter dropdown
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await fetch('/api/admin/service-categories');
        if (!response.ok) {
          throw new Error('Failed to fetch service categories');
        }
        const data: string[] = await response.json();
        setServiceCategoriesForFilter(data.sort()); // Sort them alphabetically
      } catch (err) {
        console.error("Error fetching service categories for filter:", err);
        // Optionally set an error state here for category fetching
      }
    };
    fetchServiceCategories();
  }, []);

  const fetchPhotoSets = useCallback(async (status: ApprovalStatus, workerId?: string, category?: string, currentSortBy?: string, currentSortOrder?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('status', status);
      if (workerId) {
        params.append('maintenanceWorkerId', workerId);
      }
      if (category) {
        params.append('serviceCategory', category);
      }
      if (currentSortBy) {
        params.append('sortBy', currentSortBy);
      }
      if (currentSortOrder) {
        params.append('sortOrder', currentSortOrder);
      }
      
      const response = await fetch(`/api/admin/photosets?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch photo sets');
      }
      const data: PhotoSetWithRelations[] = await response.json();
      setAllPhotoSets(data); // Update with all data for the current tab and API filters

    } catch (err) {
      console.error("Fetch error:", err);
      setError((err as Error).message);
    }
    setIsLoading(false);
  }, []);

  // Initial fetch and refetch when tab, filters, or sort order changes
  useEffect(() => {
    fetchPhotoSets(activeTab, selectedWorker, selectedCategoryFilter, sortBy, sortOrder);
  }, [activeTab, selectedWorker, selectedCategoryFilter, sortBy, sortOrder, fetchPhotoSets]);
  
  // Client-side filtering (now redundant as API does the filtering)
  // This effect applies the selectedWorker and selectedCategory filters to the allPhotoSets list
  useEffect(() => {
    const setsToFilter = allPhotoSets; // Start with data already filtered by API based on activeTab, selectedWorker, selectedCategory

    // The API now handles all filtering. This client-side filtering logic can be removed or simplified
    // if API always returns the precisely filtered list.
    // For simplicity, we assume API returns what's needed based on fetchPhotoSets params.
    setFilteredPhotoSets(setsToFilter); 

  }, [allPhotoSets, activeTab, selectedWorker, selectedCategoryFilter]);


  const handleUpdateStatus = async (photoSetId: string, newStatus: ApprovalStatus) => {
    try {
      const response = await fetch('/api/admin/photosets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoSetId, newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      // Refresh the list by re-fetching with current filters
      fetchPhotoSets(activeTab, selectedWorker, selectedCategoryFilter, sortBy, sortOrder);
    } catch (err) {
      console.error("Update status error:", err);
      alert(`Error updating status: ${(err as Error).message}`);
    }
  };

  const renderPhotoGrid = (photos: Photo[], type: 'BEFORE' | 'AFTER') => (
    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {photos.filter(p => p.type === type).map(photo => (
        <div key={photo.id} className="aspect-square overflow-hidden rounded">
          <img 
            src={photo.url} 
            alt={`${type.toLowerCase()} photo for ${photo.photoSetId}`} 
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Error')}
          />
        </div>
      ))}
    </div>
  );

  const openEditModal = (photoSet: PhotoSetWithRelations) => {
    setEditingPhotoSet({
      id: photoSet.id,
      title: photoSet.title || '', // Default to empty string if null/undefined
      description: photoSet.description || '', // Default to empty string
      serviceCategory: photoSet.serviceCategory || '', // Default to empty string
      // We don't need to load all photos or worker details into the edit state unless displaying them in modal
    });
    setIsEditModalOpen(true);
    setEditFormError(null); // Clear previous errors
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingPhotoSet) return;
    setEditingPhotoSet({
      ...editingPhotoSet,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPhotoSet || !editingPhotoSet.id) {
      setEditFormError("Error: No PhotoSet selected for editing.");
      return;
    }
    setEditFormError(null);

    try {
      const response = await fetch('/api/admin/photosets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoSetId: editingPhotoSet.id,
          title: editingPhotoSet.title,
          description: editingPhotoSet.description,
          serviceCategory: editingPhotoSet.serviceCategory,
          // Do not send status unless we are also allowing status change from edit modal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update photo set details');
      }

      setIsEditModalOpen(false);
      setEditingPhotoSet(null);
      // Refresh data to show changes
      fetchPhotoSets(activeTab, selectedWorker, selectedCategoryFilter, sortBy, sortOrder);
      // Consider a success notification here

    } catch (err) {
      console.error("Save edit error:", err);
      setEditFormError((err as Error).message);
      // alert(`Error saving changes: ${(err as Error).message}`); // Or use a more integrated notification
    }
  };

  const handleDirectUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!directUploadBeforeImages?.length || !directUploadAfterImages?.length || !directUploadServiceCategory || !directUploadTitle || !directUploadWorkerId) {
      setDirectUploadMessage({type: 'error', text: "Please fill all fields and select at least one before and one after image."} );
      return;
    }
    setIsDirectUploading(true);
    setDirectUploadMessage(null);

    const formData = new FormData();
    formData.append("title", directUploadTitle);
    formData.append("description", directUploadDescription);
    formData.append("serviceCategory", directUploadServiceCategory);
    formData.append("maintenanceWorkerId", directUploadWorkerId); 

    for (let i = 0; i < directUploadBeforeImages.length; i++) {
      formData.append("beforeImages", directUploadBeforeImages[i]);
    }
    for (let i = 0; i < directUploadAfterImages.length; i++) {
      formData.append("afterImages", directUploadAfterImages[i]);
    }

    try {
      const response = await fetch('/api/admin/photosets/direct-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload photos directly.');
      }

      setDirectUploadMessage({type: 'success', text: "Photos uploaded and approved successfully!"});
      // Clear form
      setDirectUploadTitle("");
      setDirectUploadDescription("");
      setDirectUploadServiceCategory("");
      setDirectUploadWorkerId("");
      if (document.getElementById('directBeforeImages')) {
        (document.getElementById('directBeforeImages') as HTMLInputElement).value = "";
      }
      if (document.getElementById('directAfterImages')) {
        (document.getElementById('directAfterImages') as HTMLInputElement).value = "";
      }
      setDirectUploadBeforeImages(null);
      setDirectUploadAfterImages(null);
      
      // Refresh the approved list if the current tab is APPROVED
      if(activeTab === ApprovalStatus.APPROVED) {
        fetchPhotoSets(activeTab, selectedWorker, selectedCategoryFilter, sortBy, sortOrder);
      } else {
        // If not on approved tab, maybe switch to it or just let admin navigate
      }

    } catch (err) {
      console.error("Direct upload error:", err);
      setDirectUploadMessage({type: 'error', text: (err as Error).message});
    } finally {
      setIsDirectUploading(false);
    }
  };

  const openDeleteModal = (photoSetId: string) => {
    setDeletingPhotoSetId(photoSetId);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPhotoSetId) {
      setDeleteError("No PhotoSet ID specified for deletion.");
      return;
    }
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/photosets?photoSetId=${deletingPhotoSetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete photo set');
      }
      
      setIsDeleteModalOpen(false);
      setDeletingPhotoSetId(null);
      // Refresh data to show changes
      fetchPhotoSets(activeTab, selectedWorker, selectedCategoryFilter, sortBy, sortOrder);
      // Consider a success notification/toast here
      alert('PhotoSet deleted successfully!'); // Placeholder

    } catch (err) {
      console.error("Delete error:", err);
      setDeleteError((err as Error).message);
    }
  };

  if (isLoading && !allPhotoSets.length) { 
    return <div className="p-6 text-center">Loading photo sets...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-6">Photo Set Approvals</h1>

      {/* Tabs for Approval Status */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(Object.keys(ApprovalStatus) as Array<keyof typeof ApprovalStatus>).map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => {
                setActiveTab(ApprovalStatus[statusKey]);
                // Optionally reset worker/category filters on tab change, or keep them
                // setSelectedWorker(''); 
                // setSelectedCategoryFilter('');
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                ${activeTab === ApprovalStatus[statusKey]
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {ApprovalStatus[statusKey].charAt(0) + ApprovalStatus[statusKey].slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters and Sorting Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-end">
        <div>
          <label htmlFor="workerFilter" className="block text-sm font-medium text-gray-700">Filter by Worker:</label>
          <select
            id="workerFilter"
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Workers</option>
            {maintenanceWorkers.map(worker => (
              <option key={worker.id} value={worker.id}>{worker.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700">Filter by Category:</label>
          <select
            id="categoryFilter"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Categories</option>
            {serviceCategoriesForFilter.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="submittedAt">Submission Date</option>
            <option value="workerName">Worker Name</option>
            <option value="serviceCategory">Service Category</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">Order:</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        {/* Clear Filters Button - aligned with other controls */}
        <div className="md:col-start-2 lg:col-start-auto">
             <button
                onClick={() => {
                    setSelectedWorker('');
                    setSelectedCategoryFilter('');
                    setSortBy('submittedAt');
                    setSortOrder('desc');
                }}
                className="mt-1 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Clear Filters & Sort
            </button>
        </div>
      </div>


      {isLoading && <div className="text-center py-4">Loading...</div>}
      {!isLoading && filteredPhotoSets.length === 0 && (
        <div className="text-center text-gray-500 py-10">No photo sets found for the current filters.</div>
      )}

      <div className="space-y-6">
        {filteredPhotoSets.map((ps) => (
          <div key={ps.id} className="bg-white shadow-md rounded-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Set ID: <span className="font-normal">{ps.id}</span></h2>
                <p className="text-sm text-gray-600">Worker: <span className="font-medium">{ps.maintenanceWorker?.name || 'N/A'}</span></p>
                <p className="text-sm text-gray-600">Service: <span className="font-medium">{ps.serviceCategory}</span></p>
                <p className="text-sm text-gray-600">Submitted: <span className="font-medium">{new Date(ps.submittedAt).toLocaleDateString()}</span></p>
                {ps.description && <p className="text-sm text-gray-500 mt-1">Description: {ps.description}</p>}
              </div>
              {activeTab === ApprovalStatus.PENDING && (
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <button 
                    onClick={() => handleUpdateStatus(ps.id, ApprovalStatus.APPROVED)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(ps.id, ApprovalStatus.REJECTED)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-1">Before Photos:</h3>
              {renderPhotoGrid(ps.photos, 'BEFORE')}
            </div>
            <div className="mt-4">
              <h3 className="text-md font-semibold text-gray-700 mb-1">After Photos:</h3>
              {renderPhotoGrid(ps.photos, 'AFTER')}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingPhotoSet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit PhotoSet Details</h3>
              <div className="mt-2 px-7 py-3">
                {editFormError && (
                  <p className="text-sm text-red-500 bg-red-100 p-2 rounded-md mb-3">{editFormError}</p>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4 text-left">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input 
                      type="text" 
                      name="title" 
                      id="title"
                      value={editingPhotoSet.title || ''}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea 
                      name="description" 
                      id="description"
                      rows={3}
                      value={editingPhotoSet.description || ''}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="serviceCategory" className="block text-sm font-medium text-gray-700">Service Category</label>
                     {/* Use a select if you have a predefined list of categories, otherwise text input */}
                    <input 
                      type="text" 
                      name="serviceCategory" 
                      id="serviceCategory"
                      value={editingPhotoSet.serviceCategory || ''}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      // Consider making this a select dropdown populated from `serviceCategoriesForFilter` 
                      // or a dedicated fetched list of all possible service categories.
                    />
                  </div>
                  {/* Add fields for image editing/replacement if needed */}
                </form>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  id="save-edit-button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
                <button
                  id="cancel-edit-button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Admin Upload Section */}
      <div className="mt-10 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Directly Upload & Approve Portfolio Item</h2>
        <form onSubmit={handleDirectUploadSubmit} className="space-y-4 bg-white p-6 shadow rounded-lg">
          <div>
            <label htmlFor="directTitle" className="block text-sm font-medium text-gray-700">Title*</label>
            <input type="text" name="directTitle" id="directTitle" required value={directUploadTitle} onChange={(e) => setDirectUploadTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="directDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="directDescription" id="directDescription" rows={3} value={directUploadDescription} onChange={(e) => setDirectUploadDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
          </div>
          <div>
            <label htmlFor="directServiceCategory" className="block text-sm font-medium text-gray-700">Service Category*</label>
            <select 
                name="directServiceCategory" 
                id="directServiceCategory" 
                required 
                value={directUploadServiceCategory} 
                onChange={(e) => setDirectUploadServiceCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
                <option value="">Select Category</option>
                {serviceCategoriesForFilter.map(category => (
                    <option key={`direct-${category}`} value={category}>{category}</option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="directWorkerId" className="block text-sm font-medium text-gray-700">Associate with Worker*</label>
            <select 
                name="directWorkerId" 
                id="directWorkerId" 
                required 
                value={directUploadWorkerId} 
                onChange={(e) => setDirectUploadWorkerId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
                <option value="">Select Worker</option>
                {maintenanceWorkers.map(worker => (
                    <option key={`direct-worker-${worker.id}`} value={worker.id}>{worker.name}</option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">PhotoSet requires a worker. If this is a general admin upload, select a designated admin/company worker account.</p>
          </div>
          <div>
            <label htmlFor="directBeforeImages" className="block text-sm font-medium text-gray-700">Before Images (select one or more)*</label>
            <input type="file" name="directBeforeImages" id="directBeforeImages" required multiple onChange={(e) => setDirectUploadBeforeImages(e.target.files)} accept={ALLOWED_FILE_TYPES.join(',')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
          <div>
            <label htmlFor="directAfterImages" className="block text-sm font-medium text-gray-700">After Images (select one or more)*</label>
            <input type="file" name="directAfterImages" id="directAfterImages" required multiple onChange={(e) => setDirectUploadAfterImages(e.target.files)} accept={ALLOWED_FILE_TYPES.join(',')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
          
          {directUploadMessage && (
            <div className={`p-3 rounded-md text-sm ${directUploadMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {directUploadMessage.text}
            </div>
          )}

          <div>
            <button type="submit" disabled={isDirectUploading} className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400">
              {isDirectUploading ? 'Uploading...' : 'Upload and Approve'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingPhotoSetId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete PhotoSet?</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this PhotoSet (ID: {deletingPhotoSetId}) and all its associated images? This action cannot be undone.
                </p>
                {deleteError && (
                  <p className="text-sm text-red-500 bg-red-100 p-2 rounded-md mt-3">Error: {deleteError}</p>
                )}
              </div>
              <div className="items-center px-4 py-3 flex gap-x-2">
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortfolioPage; 