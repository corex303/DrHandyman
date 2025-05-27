/* eslint-disable @next/next/no-img-element */
'use client';

import Image from 'next/image';

// Import necessary types from the CORRECT prisma client path
import { Photo, PhotoSet, PhotoType } from '../../../generated/prisma-client'; 

// This is the type we expect from the service page
export interface ApprovedPhotoSetWithPhotos extends PhotoSet {
  photos: Photo[];
}

interface BeforeAfterGalleryProps {
  items: ApprovedPhotoSetWithPhotos[]; // Changed from PortfolioItem[]
  serviceName: string;
}

const BeforeAfterGallery: React.FC<BeforeAfterGalleryProps> = ({ items, serviceName }) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600 text-lg">No before & after examples available for {serviceName} yet.</p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-semibold text-center text-gray-800 mb-10">
          Before & After Gallery: {serviceName}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {items.map((photoSet) => {
            // Find one before and one after image from the photos array
            const beforePhoto = photoSet.photos.find(p => p.type === PhotoType.BEFORE);
            const afterPhoto = photoSet.photos.find(p => p.type === PhotoType.AFTER);

            // If essential images are missing, optionally skip this item or render a placeholder
            if (!beforePhoto || !afterPhoto) {
              // console.warn(`PhotoSet ${photoSet.id} is missing a before or after photo, skipping.`);
              return null; // Or render a placeholder card
            }

            return (
              <div key={photoSet.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                {photoSet.title && (
                  <h4 className="text-xl font-semibold text-gray-800 px-6 py-4 bg-gray-100 border-b border-gray-200">
                    {photoSet.title}
                  </h4>
                )}
                <div className="grid grid-cols-2">
                  <div className="relative h-64 md:h-80">
                    <Image
                      src={beforePhoto.url} // Use URL from found beforePhoto
                      alt={`${photoSet.title || serviceName} - Before`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-opacity duration-300 hover:opacity-90"
                    />
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white px-3 py-1 text-sm font-medium">
                      BEFORE
                    </div>
                  </div>
                  <div className="relative h-64 md:h-80">
                    <Image
                      src={afterPhoto.url} // Use URL from found afterPhoto
                      alt={`${photoSet.title || serviceName} - After`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-opacity duration-300 hover:opacity-90"
                    />
                    <div className="absolute bottom-0 right-0 bg-green-600 bg-opacity-80 text-white px-3 py-1 text-sm font-medium">
                      AFTER
                    </div>
                  </div>
                </div>
                {photoSet.description && (
                  <p className="px-6 py-4 text-gray-700 text-sm">
                    {photoSet.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterGallery; 