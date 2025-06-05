'use client';

import { Photo, PhotoSet,PhotoType } from '@prisma/client';
import React, { useEffect,useState } from 'react';
import Lightbox, { SlideImage } from "yet-another-react-lightbox";

import "yet-another-react-lightbox/styles.css";

import Button from '@/components/buttons/Button';

// Optional: Import plugins if you use them, e.g., Thumbnails, Zoom
// import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
// import Zoom from "yet-another-react-lightbox/plugins/zoom";
// import "yet-another-react-lightbox/plugins/thumbnails.css";

interface PhotoSetGalleryProps {
  photoSetId?: string; // Optional if photoSetData is provided
  photoSetData?: PhotoSetWithFullPhotos; // Optional pre-loaded data
  open: boolean;
  onClose: () => void;
}

interface PhotoSetWithFullPhotos extends PhotoSet {
  photos: Photo[];
}

const PhotoSetGallery: React.FC<PhotoSetGalleryProps> = ({ photoSetId, photoSetData, open, onClose }) => {
  const [photoSet, setPhotoSet] = useState<PhotoSetWithFullPhotos | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<PhotoType>(PhotoType.BEFORE);
  const [slides, setSlides] = useState<SlideImage[]>([]);

  useEffect(() => {
    // If photoSetData is provided, use it directly
    if (open && photoSetData) {
      setPhotoSet(photoSetData);
      return; // Skip fetching
    }

    // Original fetching logic if photoSetId is provided and no photoSetData
    if (open && photoSetId && !photoSet) { 
      const fetchFullPhotoSet = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/maintenance/photo-sets/${photoSetId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch photo set for gallery`);
          }
          const data = await response.json();
          setPhotoSet(data);
        } catch (err: any) {
          console.error(`Error fetching photo set ${photoSetId} for gallery:`, err);
          setError(err.message || "An unknown error occurred.");
        }
        setIsLoading(false);
      };
      fetchFullPhotoSet();
    }
  }, [open, photoSetId, photoSet, photoSetData]); // Add photoSetData to dependency array

  useEffect(() => {
    if (photoSet) {
      const filteredPhotos = photoSet.photos.filter(p => p.type === currentView);
      setSlides(filteredPhotos.map(photo => ({ src: photo.url, alt: photo.filename || `${currentView}-${photo.id}` })));
    }
  }, [photoSet, currentView]);

  if (!open) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <p className="text-white text-xl">Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
        <p className="text-red-400 text-xl mb-4">Error: {error}</p>
        <Button onClick={onClose} variant="outline">Close</Button>
      </div>
    );
  }

  if (!photoSet) { // Should be caught by isLoading, but as a fallback
     return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <p className="text-white text-xl">Photo set data not available.</p>
        <Button onClick={onClose} variant="outline" className="ml-4">Close</Button>
      </div>
    );
  }

  const toggleView = () => {
    setCurrentView(prev => prev === PhotoType.BEFORE ? PhotoType.AFTER : PhotoType.BEFORE);
  };
  
  // Placeholder for client-side rotation - library might have plugins or custom renderers for this
  // For now, we're not implementing client-side rotation directly in this step.

  return (
    <>
      <Lightbox
        key={currentView}
        open={open}
        close={onClose}
        slides={slides}
        // plugins={[Thumbnails, Zoom]} // Optional plugins
        toolbar={{
          buttons: [
            <Button
              key="toggle-view-button"
              onClick={toggleView}
              variant="primary"
              size="sm"
              className="mr-2 bg-sky-600 hover:bg-sky-700"
            >
              Show {currentView === PhotoType.BEFORE ? 'After' : 'Before'} Images
            </Button>,
            <Button 
              key="close-gallery-button"
              onClick={onClose} 
              variant="outline" 
              size="sm" 
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Close
            </Button>
            // Add rotation buttons here if implementing client-side rotation - not part of this fix
          ]
        }}
        render={{ 
          buttonPrev: slides.length <= 1 ? () => null : undefined,
          buttonNext: slides.length <= 1 ? () => null : undefined,
          // Removed toolbar from here
        }}
      />
    </>
  );
}

export default PhotoSetGallery; 