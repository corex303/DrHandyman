import React from 'react';
import NextImage from '@/components/NextImage';
import { GallerySectionSettings, GalleryItem } from '@/types/appearance';
import { cn } from '@/lib/utils';

interface GallerySectionProps {
  settings?: GallerySectionSettings;
}

const defaultSectionSettings: GallerySectionSettings = {
  title: 'Gallery',
  subtitle: 'Browse our collection of images.',
  textAlignment: 'center',
  items: [
    { id: 'gal_def_1', imageUrl: '/images/gallery/placeholder-1.jpg', altText: 'Default Gallery Image 1', caption: 'Caption 1' },
    { id: 'gal_def_2', imageUrl: '/images/gallery/placeholder-2.jpg', altText: 'Default Gallery Image 2', caption: 'Caption 2' },
    { id: 'gal_def_3', imageUrl: '/images/gallery/placeholder-3.jpg', altText: 'Default Gallery Image 3', caption: 'Caption 3' },
  ],
  layoutStyle: 'grid',
  columns: 3,
  imageAspectRatio: '1/1',
  lightboxEnabled: false,
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  paddingTop: 'py-12',
  paddingBottom: 'pb-12',
};

export const GallerySection: React.FC<GallerySectionProps> = ({ settings: propsSettings }) => {
  const settings = { ...defaultSectionSettings, ...propsSettings };
  const items = settings.items || [];

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const columnClasses: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const aspectRatioClasses: Record<string, string> = {
    'auto': 'aspect-auto',
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '3/4': 'aspect-[3/4]',
    '16/9': 'aspect-[16/9]',
    '9/16': 'aspect-[9/16]',
  };

  // For now, only grid layout. Masonry and Carousel can be future enhancements.
  if (settings.layoutStyle === 'masonry' || settings.layoutStyle === 'carousel') {
    return (
      <section
        className={`${settings.paddingTop} ${settings.paddingBottom}`}
        style={{ backgroundColor: settings.backgroundColor }}
      >
        <div className="layout mx-auto px-4">
          <div className={`mb-12 ${textAlignClasses[settings.textAlignment || 'center']}`}>
            {settings.title && <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: settings.textColor }}>{settings.title}</h2>}
            {settings.subtitle && <p className="mx-auto max-w-2xl text-lg" style={{ color: settings.textColor ? 'rgba(0,0,0,0.7)' : undefined }}>{settings.subtitle}</p>}
          </div>
          <p className={`text-center ${textAlignClasses[settings.textAlignment || 'center']}`} style={{ color: settings.textColor }}>
            {settings.layoutStyle} layout coming soon for {items.length} items.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${settings.paddingTop} ${settings.paddingBottom}`}
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="layout mx-auto px-4">
        {(settings.title || settings.subtitle) && (
          <div className={`mb-12 ${textAlignClasses[settings.textAlignment || 'center']}`}>
            {settings.title && (
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: settings.textColor }}>
                {settings.title}
              </h2>
            )}
            {settings.subtitle && (
              <p className="mx-auto max-w-2xl text-lg" style={{ color: settings.textColor ? 'rgba(0,0,0,0.7)' : undefined }}>
                {settings.subtitle}
              </p>
            )}
          </div>
        )}

        {items.length > 0 ? (
          <div className={cn('grid gap-2 sm:gap-4', columnClasses[settings.columns || 3])}>
            {items.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  'group relative overflow-hidden rounded-md',
                  aspectRatioClasses[settings.imageAspectRatio || '1/1']
                )}
              >
                <NextImage
                  useSkeleton
                  src={item.imageUrl}
                  alt={item.altText || item.caption || 'Gallery image'}
                  layout="fill"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {item.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 p-2 text-center text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:text-sm">
                    {item.caption}
                  </div>
                )}
                {/* Lightbox functionality can be added here by wrapping the NextImage or this div */}
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-center ${textAlignClasses[settings.textAlignment || 'center']}`} style={{ color: settings.textColor }}>
            No gallery items to display yet.
          </p>
        )}
      </div>
    </section>
  );
}; 