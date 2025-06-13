import React from 'react';
import { HomepageSection } from './HeroConfig'; // Reuse from HeroConfig for now

interface SectionConfigProps {
  section: HomepageSection;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
}

const TestimonialsConfig: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => (
    <div className="space-y-3">
      <div><label className="block text-xs font-medium text-gray-500">Title</label><input type="text" value={section.settings.title || ''} onChange={e => onChange('title', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" /></div>
      <div><label className="block text-xs font-medium text-gray-500">Number of Testimonials</label><input type="number" value={section.settings.numberOfTestimonials || 3} onChange={e => onChange('numberOfTestimonials', parseInt(e.target.value, 10))} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" /></div>
      <div><label className="block text-xs font-medium text-gray-500">Layout</label><select value={section.settings.layout || 'slider'} onChange={e => onChange('layout', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"><option value="slider">Slider</option><option value="grid">Grid</option></select></div>
    </div>
);

export default TestimonialsConfig; 