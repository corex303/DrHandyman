import * as React from 'react';

import HeroSection from '@/components/sections/homepage/HeroSection';
import RecentWorkSection from '@/components/sections/homepage/RecentWorkSection';
import ServicesSection from '@/components/sections/homepage/ServicesSection';
import TestimonialsSection from '@/components/sections/homepage/TestimonialsSection';
import AudienceSegmentation from '@/components/sections/homepage/AudienceSegmentation';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <AudienceSegmentation />
      <ServicesSection />
      <RecentWorkSection />
      <TestimonialsSection />
      {/* Add other sections as needed, e.g., a CTA section or Blog highlights */}
    </main>
  );
}
