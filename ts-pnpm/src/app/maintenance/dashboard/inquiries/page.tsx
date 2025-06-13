'use client';

import { ArrowPathIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, ChevronUpIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { Inquiry, InquiryAttachment, Photo, PhotoSet, PhotoType, User } from '@prisma/client'; 
import { useRouter } from 'next/navigation'; 
import React, { useEffect, useState } from 'react';

import Button from '@/components/buttons/Button';
import PhotoSetGallery from '@/components/maintenance/PhotoSetGallery'; 

// Define a more specific type for Inquiry with included relations
interface DetailedInquiry extends Inquiry {
  customer?: User | null; 
  attachments: InquiryAttachment[];
}

// Define the extended type for a PhotoSet that includes the full Photo objects
interface PhotoSetWithFullPhotos extends PhotoSet {
  photos: Photo[];
}


const InquiryItem: React.FC<{ inquiry: DetailedInquiry }> = ({ inquiry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter(); 
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const [isAttachmentGalleryOpen, setIsAttachmentGalleryOpen] = useState(false);
  
  const handleGoToChat = async () => {
    setIsCreatingChat(true);
    setChatError(null);
     try {
      const response = await fetch('/api/maintenance/chat/from-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId: inquiry.id }),
      });
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Failed to get or create chat session');
       }
      const { conversationId } = await response.json();
      router.push(`/maintenance/dashboard/chat?conversationId=${conversationId}`);
     } catch (err: any) {
      console.error("Error transitioning to chat:", err);
      setChatError(err.message || "Could not open chat.");
     }
    setIsCreatingChat(false);
   };

  const handleOpenAttachmentGallery = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    if (inquiry.attachments && inquiry.attachments.length > 0) {
      setIsAttachmentGalleryOpen(true);
    }
  };
  
  const synthesizedPhotoSetData: PhotoSetWithFullPhotos = {
    id: inquiry.id,
    inquiryId: inquiry.id,
    title: `Attachments for Inquiry from ${inquiry.customerName}`,
    photos: inquiry.attachments
      .filter(att => att.filePath && att.fileType && att.fileType.startsWith('image/'))
      .map((att): Photo => ({
          id: att.id,
          url: att.filePath,
          filename: att.fileName,
          size: att.fileSize,
          contentType: att.fileType,
          type: PhotoType.AFTER,
          uploadedAt: att.uploadedAt,
          photoSetId: inquiry.id,
      })),
    maintenanceWorkerId: '', 
    serviceCategory: inquiry.serviceNeeded || 'General Inquiry',
    description: `Attachments for inquiry regarding: ${inquiry.message.substring(0, 100)}...`,
    status: 'APPROVED',
    submittedAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    customerId: inquiry.customerId,
  };


   return (
     <>
       <div className="bg-slate-700 p-4 rounded-lg shadow mb-4">
         <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
           <div>
             <h3 className="text-lg font-semibold text-sky-300">Inquiry from: {inquiry.customerName}</h3>
             <p className="text-xs text-slate-400">Received: {new Date(inquiry.createdAt).toLocaleString()}</p>
             <p className="text-sm text-slate-300 truncate max-w-md md:max-w-lg">Service: {inquiry.serviceNeeded || 'Not specified'}</p>
           </div>
           <div className="flex items-center">
              {inquiry.attachments.length > 0 && (
                <button 
                  onClick={handleOpenAttachmentGallery}
                  title="View Attachments"
                  className="p-1.5 mr-2 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <PhotoIcon className="h-5 w-5 text-sky-400" />
                </button>
              )}
               <Button
                onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => { e.stopPropagation(); handleGoToChat(); }} 
                variant="outline" 
                size="sm" 
                className="mr-2 border-purple-500 text-purple-400 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCreatingChat}
              >
                {isCreatingChat ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                    Chat
                  </>
                )}
               </Button>
            {isExpanded ? <ChevronUpIcon className="h-6 w-6 text-sky-400" /> : <ChevronDownIcon className="h-6 w-6 text-sky-400" />}
           </div>
         </div>
 
         {isExpanded && (
           <div className="mt-4 pt-4 border-t border-slate-600 text-sm text-slate-300">
            {chatError && <p className="text-red-500 text-xs mb-2">Error: {chatError}</p>}
             <p><strong>Customer Name:</strong> {inquiry.customerName}</p>
             <p><strong>Email:</strong> {inquiry.customerEmail}</p>
             <p><strong>Phone:</strong> {inquiry.customerPhone || 'N/A'}</p>
             <p><strong>Service Needed:</strong> {inquiry.serviceNeeded || 'N/A'}</p>
             <div className="mt-2">
               <p className="font-semibold mb-1">Message:</p>
               <p className="whitespace-pre-wrap bg-slate-650 p-3 rounded-md">{inquiry.message}</p>
             </div>
             {inquiry.attachments.length > 0 && (
               <div className="mt-3">
                 <p className="font-semibold mb-1">Attachments:</p>
                 <ul className="list-disc list-inside pl-1">
                   {inquiry.attachments.map(att => (
                     <li key={att.id}>
                       <a href={att.filePath} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline">
                         {att.fileName} ({att.fileType}, {(att.fileSize / 1024).toFixed(2)} KB)
                         {att.fileType && att.fileType.startsWith('image/') && (
                           <span className="text-xs text-slate-400 ml-2">(Image)</span>
                         )}
                       </a>
                     </li>
                   ))}
                 </ul>
               </div>
             )}
           </div>
         )}
       </div>
      {isAttachmentGalleryOpen && (
         <PhotoSetGallery
          photoSetData={synthesizedPhotoSetData}
          open={isAttachmentGalleryOpen}
          onClose={() => setIsAttachmentGalleryOpen(false)}
         />
       )}
     </>
   );
};

export default function MaintenanceInquiriesPage() {
  const [inquiries, setInquiries] = useState<DetailedInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/maintenance/inquiries');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch inquiries');
        }
        const data = await response.json();
        setInquiries(data);
      } catch (err: any) {
        console.error("Error fetching inquiries:", err);
        setError(err.message || "An unknown error occurred while fetching inquiries.");
      }
      setIsLoading(false);
    };
    fetchInquiries();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-4xl mx-auto bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-700">
          <h1 className="text-3xl sm:text-4xl font-bold text-teal-400">Customer Inquiries</h1>
        </div>

        {isLoading && <p className="text-slate-300 text-center py-6">Loading inquiries...</p>}
        {error && <p className="text-red-500 text-center py-6">Error: {error}</p>}
        {!isLoading && !error && inquiries.length === 0 && (
          <p className="text-slate-300 text-center py-6">No customer inquiries found.</p>
        )}
        {!isLoading && !error && inquiries.length > 0 && (
          <div>
            {inquiries.map((inquiry: DetailedInquiry) => (
              <InquiryItem key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 