'use client';

import Image from 'next/image';
import { type PortfolioItem } from '../../../node_modules/.prisma/client'; // Direct import workaround

// Manual type removed
// interface PortfolioItem {
//   id: string;
//   title: string | null;
//   description: string | null;
//   beforeImageUrl: string;
//   afterImageUrl: string;
//   serviceId: string;
// }

interface BeforeAfterGalleryProps {
  items: PortfolioItem[];
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
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
              {item.title && (
                <h4 className="text-xl font-semibold text-gray-800 px-6 py-4 bg-gray-100 border-b border-gray-200">
                  {item.title}
                </h4>
              )}
              <div className="grid grid-cols-2">
                <div className="relative h-64 md:h-80">
                  <Image
                    src={item.beforeImageUrl}
                    alt={`${item.title || serviceName} - Before`}
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
                    src={item.afterImageUrl}
                    alt={`${item.title || serviceName} - After`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-opacity duration-300 hover:opacity-90"
                  />
                  <div className="absolute bottom-0 right-0 bg-green-600 bg-opacity-80 text-white px-3 py-1 text-sm font-medium">
                    AFTER
                  </div>
                </div>
              </div>
              {item.description && (
                <p className="px-6 py-4 text-gray-700 text-sm">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterGallery; 