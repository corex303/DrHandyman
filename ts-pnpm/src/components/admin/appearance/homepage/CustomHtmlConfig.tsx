import React from 'react';
import { HomepageSection } from './HeroConfig'; // Reuse from HeroConfig for now

interface SectionConfigProps {
  section: HomepageSection;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
}

const CustomHtmlConfig: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">HTML Content</label>
    <textarea value={section.settings.htmlContent || ''} onChange={e => onChange('htmlContent', e.target.value)} disabled={disabled} rows={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
  </div>
);

export default CustomHtmlConfig; 