'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Inquiry, InquiryAttachment, Prisma } from '@prisma/client'; // Assuming Prisma types are available
import Button from '@/components/buttons/Button';
import { ChevronDownIcon, ChevronUpIcon, PaperClipIcon, ChatBubbleLeftRightIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation'; // Import useRouter
import PhotoSetGallery from '@/components/maintenance/PhotoSetGallery'; // Import the gallery

// Define a more specific type for Inquiry with included relations
interface DetailedInquiry extends Inquiry {
  customer?: User | null; // Customer might be null if not a registered user
  attachments: InquiryAttachment[];
  // photoSets will not be directly on Inquiry anymore after schema reversion
}

// Define a type for the gallery slides, compatible with InquiryAttachment
interface GallerySlide {
  src: string;
  alt: string;
  // Add other PhotoSet specific fields as optional if your gallery uses them
  // For Inquiry Attachments, we primarily need src and alt.
  // The 'type' (BEFORE/AFTER) is less relevant here.
}

const InquiryItem: React.FC<{ inquiry: DetailedInquiry }> = ({ inquiry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter(); // Initialize router
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  // State for attachment gallery
  const [isAttachmentGalleryOpen, setIsAttachmentGalleryOpen] = useState(false);
  const [attachmentSlides, setAttachmentSlides] = useState<GallerySlide[]>([]);

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
      // Optionally, display this error to the user more prominently
    }
    setIsCreatingChat(false);
  };

  const handleOpenAttachmentGallery = () => {
    if (inquiry.attachments && inquiry.attachments.length > 0) {
      const slidesForGallery: GallerySlide[] = inquiry.attachments
        .filter(att => att.fileType && (att.fileType.startsWith('image/'))) // Only show images in gallery
        .map(att => ({
          src: att.filePath, // filePath is the URL
          alt: att.fileName || `Attachment ${att.id}`,
        }));
      setAttachmentSlides(slidesForGallery);
      setIsAttachmentGalleryOpen(true);
    }
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
                  onClick={(e) => { e.stopPropagation(); handleOpenAttachmentGallery(); }}
                  title="View Attachments"
                  className="p-1.5 mr-2 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <PhotoIcon className="h-5 w-5 text-sky-400" />
                </button>
              )}
              <Button 
                onClick={(e) => { e.stopPropagation(); handleGoToChat(); }} 
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
             {/* Placeholder for chat link/button if needed here too */}
          </div>
        )}
      </div>
      {isAttachmentGalleryOpen && inquiry.attachments.length > 0 && (
        <PhotoSetGallery
          // Pass the synthesized photoSetData
          photoSetData={{
            id: inquiry.id, // Use inquiry ID as a stand-in for photoSetId
            title: `Attachments for Inquiry from ${inquiry.customerName}`,
            photos: inquiry.attachments
              .filter(att => att.fileType && att.fileType.startsWith('image/'))
              .map(att => ({
                id: att.id,
                url: att.filePath,
                filename: att.fileName,
                type: 'AFTER', // Default to 'AFTER' to show images. Toggle might not be meaningful here.
                size: att.fileSize,
                contentType: att.fileType,
                uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
                photoSetId: inquiry.id, // Stand-in
              })),
            maintenanceWorkerId: 'synth-worker-id', // Provide a stand-in ID
            serviceCategory: inquiry.serviceNeeded || '',
            status: 'PENDING', // Stand-in status, not relevant for attachments display
            submittedAt: new Date(inquiry.createdAt),
            updatedAt: new Date(inquiry.updatedAt),
            description: null, // Or some default
            customerId: inquiry.customerId || null, // Ensure it's explicitly null if inquiry.customerId is undefined/null
          }}
          open={isAttachmentGalleryOpen}
          onClose={() => setIsAttachmentGalleryOpen(false)}
          // photoSetId is not needed here as we are providing photoSetData
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
          <Link href="/maintenance/dashboard" passHref>
            <Button variant='outline' className='border-sky-500 text-sky-400 hover:bg-sky-600'>
                &larr; Back to Dashboard
            </Button>
          </Link>
        </div>

        {isLoading && <p className="text-slate-300 text-center py-6">Loading inquiries...</p>}
        {error && <p className="text-red-500 text-center py-6">Error: {error}</p>}
        {!isLoading && !error && inquiries.length === 0 && (
          <p className="text-slate-300 text-center py-6">No customer inquiries found.</p>
        )}
        {!isLoading && !error && inquiries.length > 0 && (
          <div>
            {inquiries.map(inquiry => (
              <InquiryItem key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 