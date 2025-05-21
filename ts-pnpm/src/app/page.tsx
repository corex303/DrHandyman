import Link from 'next/link';
import { FaCheck, FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa';
import { Suspense } from 'react';

import ButtonLink from '@/components/links/ButtonLink';
import NextImage from '@/components/NextImage';

import { getSiteAppearanceSettings } from '@/lib/settings';
import { defaultAppearanceSettings } from '@/types/appearance';
import * as Sections from '@/components/sections'; // Import all section components

// Helper to map section type to component
const sectionComponentsMap: Record<string, React.FC<any>> = {
  hero: Sections.HeroSection,
  services: Sections.ServicesSection,
  testimonials: Sections.TestimonialsSection,
  cta: Sections.CallToActionSection,
  portfolio: Sections.PortfolioSection,
  gallery: Sections.GallerySection,
  faq: Sections.FaqSection,
  customHtml: Sections.CustomHtmlSection,
  // Add other section types here as they are created
};

export default async function HomePage() {
  const appearanceSettings = await getSiteAppearanceSettings();
  const homepageLayout = appearanceSettings.homepage?.layout || defaultAppearanceSettings.homepage?.layout || [];

  return (
    <Suspense fallback={<div>Loading page layout...</div>}>
      {homepageLayout.map((sectionConfig) => {
        const SectionComponent = sectionComponentsMap[sectionConfig.type];
        if (SectionComponent) {
          return <SectionComponent key={sectionConfig.id} settings={sectionConfig.settings} />;
        } else {
          // Optional: Render a placeholder or log a warning for unknown section types
          return (
            <div key={sectionConfig.id} className="py-8 text-center text-red-500">
              Unknown section type: {sectionConfig.type}. Please configure or implement this component.
            </div>
          );
        }
      })}
      {/* Fallback content if no sections are defined */}
      {homepageLayout.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to the Site!</h1>
          <p className="text-xl text-gray-600">Homepage content is being configured. Please check back soon.</p>
        </div>
      )}
    </Suspense>
  );
}
