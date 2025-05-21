import React from 'react';
import Link from 'next/link';
import NextImage from '@/components/NextImage';
import ButtonLink from '@/components/links/ButtonLink';
import { PortfolioSectionSettings, PortfolioItem } from '@/types/appearance';
import { cn } from '@/lib/utils'; // For conditional classes

interface PortfolioSectionProps {
  settings?: PortfolioSectionSettings;
}

const defaultSectionSettings: PortfolioSectionSettings = {
  title: 'Our Work',
  subtitle: 'Check out some of our featured projects.',
  textAlignment: 'center',
  columns: 3,
  items: [
    { id: 'p1_default', imageUrl: '/images/portfolio/placeholder-1.jpg', title: 'Project Alpha', category: 'Web Design', description: 'A stunning new website.', link: '#' },
    { id: 'p2_default', imageUrl: '/images/portfolio/placeholder-2.jpg', title: 'Project Beta', category: 'Renovation', description: 'Modern home renovation.', link: '#' },
    { id: 'p3_default', imageUrl: '/images/portfolio/placeholder-3.jpg', title: 'Project Gamma', category: 'Landscaping', description: 'Beautiful garden design.', link: '#' },
  ],
  showViewAllButton: true,
  viewAllButtonText: 'View All Projects',
  viewAllButtonLink: '/portfolio',
  viewAllButtonVariant: 'primary',
  itemStyle: 'card',
  imageAspectRatio: '16/9',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  itemTitleColor: '#111827',
  itemTextColor: '#6B7280', // gray-500 for slightly lighter item text
  paddingTop: 'py-12',
  paddingBottom: 'pb-12',
};

const PortfolioItemCard: React.FC<{ item: PortfolioItem, settings: PortfolioSectionSettings }> = ({ item, settings }) => {
  const aspectRatioClasses: Record<string, string> = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    'auto': '',
  };

  const content = (
    <>
      <div className={cn(
        'relative w-full overflow-hidden rounded-t-lg',
        aspectRatioClasses[settings.imageAspectRatio || '16/9']
      )}>
        <NextImage
          useSkeleton
          src={item.imageUrl}
          alt={item.title}
          layout="fill"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4 md:p-6">
        {item.category && <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: settings.itemTextColor }}>{item.category}</p>}
        <h3 className="mb-2 text-lg font-bold leading-tight" style={{ color: settings.itemTitleColor }}>{item.title}</h3>
        {item.description && <p className="text-sm leading-relaxed line-clamp-2" style={{ color: settings.itemTextColor }}>{item.description}</p>}
      </div>
    </>
  );

  if (item.link) {
    return (
      <Link href={item.link} className="group block rounded-lg shadow-md transition-shadow duration-300 hover:shadow-xl overflow-hidden h-full flex flex-col" style={{ backgroundColor: settings.itemBackgroundColor }}>
        {content}
      </Link>
    );
  }
  return (
    <div className="group rounded-lg shadow-md overflow-hidden h-full flex flex-col" style={{ backgroundColor: settings.itemBackgroundColor }}>
      {content}
    </div>
  );
};

const PortfolioItemOverlay: React.FC<{ item: PortfolioItem, settings: PortfolioSectionSettings }> = ({ item, settings }) => {
  const aspectRatioClasses: Record<string, string> = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    'auto': '',
  };
  
  const content = (
    <div className={cn(
      'relative w-full overflow-hidden group rounded-lg',
      aspectRatioClasses[settings.imageAspectRatio || '16/9']
    )}>
      <NextImage
        useSkeleton
        src={item.imageUrl}
        alt={item.title}
        layout="fill"
        className="object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center text-white opacity-0 group-hover:opacity-100">
        {item.category && <p className="mb-1 text-xs font-semibold uppercase tracking-wider">{item.category}</p>}
        <h3 className="mb-2 text-lg font-bold leading-tight">{item.title}</h3>
        {item.description && <p className="text-sm leading-relaxed line-clamp-3">{item.description}</p>}
      </div>
    </div>
  );

  if (item.link) {
    return <Link href={item.link} className="block h-full">{content}</Link>;
  }
  return <div className="h-full">{content}</div>;
};

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ settings: propsSettings }) => {
  const settings = { ...defaultSectionSettings, ...propsSettings };
  const items = settings.items || [];

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const columnClasses = {
    2: 'sm:grid-cols-1 md:grid-cols-2',
    3: 'sm:grid-cols-1 md:grid-cols-3',
    4: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4', // Added 4 columns for lg
  };

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

        {items.length > 0 && (
          <div className={`grid gap-8 ${columnClasses[settings.columns || 3]}`}>
            {items.map((item) => (
              settings.itemStyle === 'overlay' ? 
                <PortfolioItemOverlay key={item.id} item={item} settings={settings} /> :
                <PortfolioItemCard key={item.id} item={item} settings={settings} />
            ))}
          </div>
        )}

        {items.length === 0 && (
          <p className={`text-center ${textAlignClasses[settings.textAlignment || 'center']}`} style={{color: settings.textColor}}>
            No portfolio items to display yet.
          </p>
        )}

        {settings.showViewAllButton && settings.viewAllButtonLink && settings.viewAllButtonText && (
          <div className={`mt-12 ${textAlignClasses[settings.textAlignment || 'center']}`}>
            <ButtonLink href={settings.viewAllButtonLink} variant={settings.viewAllButtonVariant || 'primary'}>
              {settings.viewAllButtonText}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}; 