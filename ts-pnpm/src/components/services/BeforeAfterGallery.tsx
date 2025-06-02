/* eslint-disable @next/next/no-img-element */
'use client';

import Image from 'next/image';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

// Import necessary types from the CORRECT prisma client path
import { Photo, PhotoSet, PhotoType } from '../../../generated/prisma-client';

// This is the type we expect from the service page
export interface ApprovedPhotoSetWithPhotos extends PhotoSet {
  photos: Photo[];
}

interface BeforeAfterGalleryProps {
  items: ApprovedPhotoSetWithPhotos[];
  serviceName: string;
}

const BeforeAfterGallery: React.FC<BeforeAfterGalleryProps> = ({ items, serviceName }) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600 text-lg">
          No before & after examples available for {serviceName} yet.
        </p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-semibold text-center text-gray-800 mb-10">
          Before & After Gallery: {serviceName}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 lg:gap-x-10 lg:gap-y-16">
          {items.map((photoSet) => {
            const beforePhoto = photoSet.photos.find((p) => p.type === PhotoType.BEFORE);
            const afterPhoto = photoSet.photos.find((p) => p.type === PhotoType.AFTER);

            if (!beforePhoto || !afterPhoto) {
              return (
                <div key={photoSet.id} className="bg-white rounded-xl shadow-lg overflow-hidden p-6 text-center">
                  <p className="text-gray-500">Photo data incomplete for this set.</p>
                  {photoSet.title && <p className="text-sm text-gray-400 mt-2">{photoSet.title}</p>}
                </div>
              );
            }

            return (
              <div key={photoSet.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                {photoSet.title && (
                  <h4 className="text-xl font-semibold text-gray-800 px-6 py-4 bg-gray-100 border-b border-gray-200 text-center">
                    {photoSet.title}
                  </h4>
                )}
                <div className="relative w-full aspect-[4/3] sm:aspect-video md:aspect-[4/3]">
                  <ReactCompareSlider
                    itemOne={<ReactCompareSliderImage src={beforePhoto.url} alt={`${photoSet.title || serviceName} - Before`} />}
                    itemTwo={<ReactCompareSliderImage src={afterPhoto.url} alt={`${photoSet.title || serviceName} - After`} />}
                    className="w-full h-full rounded-b-lg md:rounded-b-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                {photoSet.description && (
                  <p className="px-6 py-4 text-gray-700 text-sm mt-auto border-t border-gray-200">
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