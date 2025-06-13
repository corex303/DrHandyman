import React from 'react';

// It's often better to have shared types in a central file, 
// but for this refactoring step, we'll keep it here.
export interface HomepageSection {
  id: string;
  type: 'hero' | 'services' | 'customHtml' | 'testimonials' | 'portfolio';
  settings: Record<string, any>;
  enabled: boolean;
}

interface SectionConfigProps {
  section: HomepageSection;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
}

const HeroConfig: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-500">Title</label>
      <input type="text" value={section.settings.title || ''} onChange={e => onChange('title', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500">Subtitle</label>
      <input type="text" value={section.settings.subtitle || ''} onChange={e => onChange('subtitle', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500">CTA Text</label>
      <input type="text" value={section.settings.ctaText || ''} onChange={e => onChange('ctaText', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500">CTA Link</label>
      <input type="text" value={section.settings.ctaLink || ''} onChange={e => onChange('ctaLink', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500">Background Image URL</label>
      <input type="text" value={section.settings.backgroundImageUrl || ''} onChange={e => onChange('backgroundImageUrl', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
       <p className="mt-1 text-xs text-gray-400">Use an absolute URL or a path from /public folder (e.g., /images/my-hero.jpg)</p>
    </div>
  </div>
);

export default HeroConfig; 