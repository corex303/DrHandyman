import React from 'react';

import NextImage from '@/components/NextImage'; // For avatars

import {TestimonialsSectionSettings } from '@/types/appearance';

interface TestimonialsSectionProps {
  settings?: TestimonialsSectionSettings;
}

const defaultSectionSettings: TestimonialsSectionSettings = {
  title: 'Testimonials',
  subtitle: 'Hear what our customers have to say.',
  textAlignment: 'center',
  layoutStyle: 'grid',
  columns: 2,
  testimonials: [
    { id: 't1_default', quote: 'Amazing service, very professional!', authorName: 'Jane D.', authorRole: 'Customer', avatarUrl: '/images/avatars/avatar-placeholder.png' },
    { id: 't2_default', quote: 'Quick response and quality work.', authorName: 'John S.', authorRole: 'Client', avatarUrl: '/images/avatars/avatar-placeholder.png' },
  ],
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  itemBackgroundColor: '#F9FAFB',
  itemTextColor: '#4B5563',
  authorTextColor: '#111827', // Darker for author name
  paddingTop: 'py-12',
  paddingBottom: 'pb-12',
};

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ settings: propsSettings }) => {
  const settings = { ...defaultSectionSettings, ...propsSettings };
  const testimonials = settings.testimonials || [];

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const columnClasses = {
    2: 'sm:grid-cols-1 md:grid-cols-2',
    3: 'sm:grid-cols-1 md:grid-cols-3',
  };

  // For now, only implementing grid layout. Carousel can be added later.
  if (settings.layoutStyle === 'carousel' && testimonials.length > 0) {
    // Placeholder for carousel implementation
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
          <p className={`text-center ${textAlignClasses[settings.textAlignment || 'center']}`} style={{color: settings.textColor}}>
            Carousel view coming soon for {testimonials.length} testimonials.
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

        {testimonials.length > 0 && (
          <div className={`grid gap-8 ${columnClasses[settings.columns || 2]}`}>
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="flex flex-col rounded-lg p-6 shadow-sm"
                style={{
                  backgroundColor: settings.itemBackgroundColor,
                  color: settings.itemTextColor
                }}
              >
                {testimonial.avatarUrl && (
                  <div className="mb-4 flex justify-center">
                    <NextImage 
                      useSkeleton 
                      src={testimonial.avatarUrl} 
                      alt={`${testimonial.authorName}'s avatar`}
                      width={80} 
                      height={80} 
                      className="rounded-full"
                      classNames={{ image: "rounded-full"}}
                    />
                  </div>
                )}
                <blockquote className="mb-4 flex-grow text-center italic">
                  <p style={{ color: settings.itemTextColor }}>"{testimonial.quote}"</p>
                </blockquote>
                <footer className="mt-auto text-center">
                  <p className="font-semibold" style={{ color: settings.authorTextColor }}>{testimonial.authorName}</p>
                  {(testimonial.authorRole || testimonial.authorCompany) && (
                    <p className="text-sm" style={{ color: settings.itemTextColor ? 'rgba(0,0,0,0.6)' : undefined }}>
                      {testimonial.authorRole}{testimonial.authorRole && testimonial.authorCompany && ', '}{testimonial.authorCompany}
                    </p>
                  )}
                </footer>
              </div>
            ))}
          </div>
        )}

        {testimonials.length === 0 && (
           <p className={`text-center ${textAlignClasses[settings.textAlignment || 'center']}`} style={{color: settings.textColor}}>
            No testimonials to display yet.
          </p>
        )}
      </div>
    </section>
  );
}; 