"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/buttons/Button';
import { Photo, PhotoSet, ApprovalStatus } from '@prisma/client';
import PhotoSetGallery from '@/components/maintenance/PhotoSetGallery';

// Interface for the PhotoSet with included photos (for dashboard preview)
interface PhotoSetWithPreviewPhotos extends PhotoSet {
  photos: Photo[]; // Preview photos (e.g., first 6)
}

// No longer using next-auth for this page
// import { useSession, signOut } from 'next-auth/react'; 
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// export async function getServerSideProps(context: any) {
//   const session = await getServerSession(context.req, context.res, authOptions);

//   if (!session || session.user?.role !== 'MAINTENANCE') {
//     return {
//       redirect: {
//         destination: '/maintenance/login?error=AccessDenied',
//         permanent: false,
//       },
//     };
//   }

//   return {
//     props: { session }, 
//   };
// }

export default function MaintenanceDashboardPage() {
  const router = useRouter();
  const [photoSets, setPhotoSets] = useState<PhotoSetWithPreviewPhotos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [galleryPhotoSetId, setGalleryPhotoSetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotoSets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/maintenance/photo-sets');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch photo sets: ${response.status}`);
        }
        const data = await response.json();
        setPhotoSets(data);
      } catch (err: any) {
        console.error("Error fetching photo sets:", err);
        setError(err.message || "An unknown error occurred while fetching photo sets.");
      }
      setIsLoading(false);
    };

    fetchPhotoSets();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/maintenance/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error("Failed to logout from maintenance session", error);
    } finally {
      router.push('/maintenance/login');
    }
  };

  // Middleware now handles the auth check. 
  // If the user reaches this page, they are considered authenticated for maintenance.

  // if (status === "loading") {
  //   return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  // }

  // if (status === "unauthenticated" || session?.user?.role !== 'MAINTENANCE') {
  //   // This should ideally be caught by middleware or getServerSideProps earlier
  //   // router.push('/maintenance/login?error=AccessDenied'); 
  //   // return <div className="flex justify-center items-center min-h-screen">Redirecting to login...</div>;
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
  //       <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
  //         <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
  //         <p className="text-gray-700 mb-6">
  //           You do not have permission to access this page.
  //         </p>
  //         <Button onClick={() => router.push('/maintenance/login')} className="w-full">
  //           Go to Login
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return 'text-green-400';
      case ApprovalStatus.PENDING:
        return 'text-yellow-400';
      case ApprovalStatus.REJECTED:
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 text-white">
      <div className="bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 max-w-6xl w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-10 pb-4 border-b border-slate-700">
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-400 mb-4 sm:mb-0 text-center sm:text-left">Maintenance Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full sm:w-auto">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Upload Work Photos */}
          <div className="bg-slate-700 p-6 rounded-lg shadow-lg hover:shadow-sky-500/50 transition-shadow duration-300 flex flex-col">
            <h2 className="text-xl sm:text-2xl font-semibold text-sky-400 mb-3">Upload Work Photos</h2>
            <p className="text-slate-300 text-sm sm:text-base mb-4 flex-grow">
              Submit before and after photos of completed maintenance work. Access the dedicated page for uploading images.
            </p>
            <Link href="/maintenance/dashboard/upload" passHref>
              <Button variant="primary" className="w-full bg-sky-500 hover:bg-sky-600 text-white mt-auto">Go to Photo Upload</Button>
            </Link>
          </div>

          {/* Card 2: Messages & Chat */}
          <div className="bg-slate-700 p-6 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-shadow duration-300 flex flex-col">
            <h2 className="text-xl sm:text-2xl font-semibold text-purple-400 mb-3">Messages & Chat</h2>
            <p className="text-slate-300 text-sm sm:text-base mb-4 flex-grow">
              Communicate with customers and administrative staff regarding work orders and updates.
            </p>
            <Link href="/maintenance/dashboard/chat" passHref>
              <Button variant="outline" className="w-full border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white mt-auto">Open Chat</Button>
            </Link>
          </div>

          {/* Card 3: View Customer Inquiries */}
          <div className="bg-slate-700 p-6 rounded-lg shadow-lg hover:shadow-teal-500/50 transition-shadow duration-300 flex flex-col">
            <h2 className="text-xl sm:text-2xl font-semibold text-teal-400 mb-3">View Customer Inquiries</h2>
            <p className="text-slate-300 text-sm sm:text-base mb-4 flex-grow">
              Review customer inquiries, view details, and respond via chat.
            </p>
            <Link href="/maintenance/dashboard/inquiries" passHref>
              <Button variant="outline" className="w-full border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white mt-auto">
                View Inquiries
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Photo Upload Status Overview Section */}
        <div className="bg-slate-700 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-4">Recent Photo Submissions</h2>
          {isLoading && <p className="text-slate-300 text-center py-4">Loading photo submissions...</p>}
          {error && <p className="text-red-500 text-center py-4">Error: {error}</p>}
          {!isLoading && !error && photoSets.length === 0 && (
            <p className="text-slate-300 text-center py-4">No photo submissions found.</p>
          )}
          {!isLoading && !error && photoSets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photoSets.map((set) => (
                <div key={set.id} className="bg-slate-600 p-4 rounded-md shadow flex flex-col">
                  <h3 className="text-lg font-semibold text-sky-300 truncate mb-1" title={set.title || `Set ID: ${set.id}`}>{set.title || `Submission ID: ${set.id.substring(0,8)}...`}</h3>
                  <p className="text-xs text-slate-400 mb-1">Submitted: {new Date(set.submittedAt).toLocaleDateString()}</p>
                  <p className={`text-sm font-medium ${getStatusColor(set.status)} mb-2`}>Status: {set.status}</p>
                  {set.description && <p className="text-xs text-slate-300 mt-1 mb-2 italic truncate flex-grow">Description: {set.description}</p>}
                  <div className="mt-auto flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-700">
                    {set.photos.map(photo => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" title={`View ${photo.type || 'photo'} in new tab`}>
                        <img 
                          src={photo.url} 
                          alt={photo.type || 'upload'} 
                          className="h-20 w-20 object-cover rounded-sm flex-shrink-0 border-2 border-slate-500 hover:border-sky-400 transition-colors cursor-pointer"
                        />
                      </a>
                    ))}
                    {set.photos.length === 0 && <p className='text-xs text-slate-400 self-center'>No photos in this set.</p>}
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setGalleryPhotoSetId(set.id)}
                      className="text-sky-400 border-sky-400 hover:bg-sky-500 hover:text-white flex-1"
                    >
                      Open Gallery
                    </Button>
                    <Link href={`/maintenance/dashboard/photosets/${set.id}`} passHref className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-purple-400 border-purple-400 hover:bg-purple-500 hover:text-white w-full"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 text-center border-t border-slate-700 pt-6">
          <p className="text-slate-400 text-sm">
            Dr. Handyman Maintenance Portal | For assistance, contact support.
          </p>
        </div>
      </div>

      {galleryPhotoSetId && (
        <PhotoSetGallery 
          photoSetId={galleryPhotoSetId} 
          open={!!galleryPhotoSetId}
          onClose={() => setGalleryPhotoSetId(null)}
        />
      )}
    </div>
  );
} 