'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// --- Interfaces ---
interface AppearanceSettings {
  homepageSections?: HomepageSection[];
}

export interface HomepageSection {
  id: string;
  type: 'hero' | 'services' | 'customHtml' | 'testimonials' | 'portfolio'; // Expanded types
  settings: Record<string, any>;
  enabled: boolean;
}

// --- Default Section Settings ---
const getDefaultSettingsForType = (type: HomepageSection['type']) => {
  switch (type) {
    case 'hero':
      return {
        title: 'Welcome Hero!',
        subtitle: 'This is a great hero section.',
        ctaText: 'Learn More',
        ctaLink: '/about',
        backgroundImageUrl: '/images/placeholder-hero.jpg',
      };
    case 'services':
      return {
        title: 'Our Awesome Services',
        numberOfServices: 3,
        layout: 'grid', // 'grid' | 'list'
      };
    case 'customHtml':
      return {
        htmlContent: '<p>Your custom HTML content goes here.</p>',
      };
    case 'testimonials':
      return {
        title: 'What Our Clients Say',
        numberOfTestimonials: 3,
        layout: 'slider', // 'slider' | 'grid'
      };
    case 'portfolio':
      return {
        title: 'Our Recent Work',
        numberOfItems: 4,
        layout: 'grid', // 'grid' | 'carousel'
      };
    default:
      return { title: 'New Section' };
  }
};

const defaultHomepageSections: HomepageSection[] = [
  {
    id: `hero-${Date.now()}`,
    type: 'hero',
    settings: getDefaultSettingsForType('hero'),
    enabled: true,
  },
  {
    id: `services-${Date.now() + 1}`,
    type: 'services',
    settings: getDefaultSettingsForType('services'),
    enabled: true,
  },
];

// --- Helper: Section Configuration Components (Inline for simplicity) ---

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

const ServicesConfig: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-500">Title</label>
      <input type="text" value={section.settings.title || ''} onChange={e => onChange('title', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500">Number of Services to Show</label>
      <input type="number" value={section.settings.numberOfServices || 3} onChange={e => onChange('numberOfServices', parseInt(e.target.value, 10))} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500">Layout</label>
      <select value={section.settings.layout || 'grid'} onChange={e => onChange('layout', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
        <option value="grid">Grid</option>
        <option value="list">List</option>
      </select>
    </div>
  </div>
);

const CustomHtmlConfig: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">HTML Content</label>
    <textarea value={section.settings.htmlContent || ''} onChange={e => onChange('htmlContent', e.target.value)} disabled={disabled} rows={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
  </div>
);

const TestimonialsConfig: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => (
  <div className="space-y-3">
    <div><label className="block text-xs font-medium text-gray-500">Title</label><input type="text" value={section.settings.title || ''} onChange={e => onChange('title', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" /></div>
    <div><label className="block text-xs font-medium text-gray-500">Number of Testimonials</label><input type="number" value={section.settings.numberOfTestimonials || 3} onChange={e => onChange('numberOfTestimonials', parseInt(e.target.value, 10))} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" /></div>
    <div><label className="block text-xs font-medium text-gray-500">Layout</label><select value={section.settings.layout || 'slider'} onChange={e => onChange('layout', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"><option value="slider">Slider</option><option value="grid">Grid</option></select></div>
  </div>
);

const PortfolioConfig: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => (
  <div className="space-y-3">
     <div><label className="block text-xs font-medium text-gray-500">Title</label><input type="text" value={section.settings.title || ''} onChange={e => onChange('title', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" /></div>
    <div><label className="block text-xs font-medium text-gray-500">Number of Items</label><input type="number" value={section.settings.numberOfItems || 4} onChange={e => onChange('numberOfItems', parseInt(e.target.value, 10))} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" /></div>
    <div><label className="block text-xs font-medium text-gray-500">Layout</label><select value={section.settings.layout || 'grid'} onChange={e => onChange('layout', e.target.value)} disabled={disabled} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"><option value="grid">Grid</option><option value="carousel">Carousel</option></select></div>
  </div>
);

const sectionConfigMap: Record<HomepageSection['type'], React.FC<SectionConfigProps>> = {
  hero: HeroConfig,
  services: ServicesConfig,
  customHtml: CustomHtmlConfig,
  testimonials: TestimonialsConfig,
  portfolio: PortfolioConfig,
};

// --- Main Component ---
export default function HomepageAppearancePage() {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSections, setCurrentSections] = useState<HomepageSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null); // For modal/inline edit view

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/appearance');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data: AppearanceSettings = await response.json();
      setSettings(data);
      setCurrentSections(data.homepageSections && data.homepageSections.length > 0 ? data.homepageSections : defaultHomepageSections);
    } catch (error: any) {
      toast.error(error.message || 'Could not load settings.');
      console.error(error);
      setCurrentSections(defaultHomepageSections);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSectionChange = (sectionId: string, newSectionData: Partial<HomepageSection>) => {
    setCurrentSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, ...newSectionData } : s))
    );
  };

  const handleSectionSettingsChange = (sectionId: string, settingKey: string, value: any) => {
    setCurrentSections(prev =>
      prev.map(s =>
        s.id === sectionId
          ? { ...s, settings: { ...s.settings, [settingKey]: value } }
          : s
      )
    );
  };

  const addSection = (type: HomepageSection['type']) => {
    const newSection: HomepageSection = {
      id: `${type}-${Date.now()}`,
      type: type,
      settings: getDefaultSettingsForType(type),
      enabled: true,
    };
    setCurrentSections(prev => [...prev, newSection]);
    setEditingSectionId(newSection.id); // Open new section for editing
    toast.success(`Added new ${type} section.`);
  };

  const removeSection = (id: string) => {
    setCurrentSections(prev => prev.filter(s => s.id !== id));
    if (editingSectionId === id) setEditingSectionId(null);
    toast.success('Section removed.');
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(currentSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCurrentSections(items);
  };

  const handleSaveChanges = async () => {
    if (!settings && currentSections.length === 0) { // Allow saving if settings is null but we have sections
        // This case might happen if API fails initially but user adds sections and saves
        console.warn('Attempting to save with null initial settings but populated currentSections.');
    }
    setIsSaving(true);
    toast.loading('Saving homepage layout...');

    const settingsToSave = settings || {}; // Ensure settings is an object

    try {
      const updatedSettingsPayload: AppearanceSettings = {
        ...settingsToSave,
        homepageSections: currentSections,
      };

      const response = await fetch('/api/admin/settings/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettingsPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const updatedData: AppearanceSettings = await response.json();
      setSettings(updatedData);
      setCurrentSections(updatedData.homepageSections || defaultHomepageSections);
      toast.dismiss();
      toast.success('Homepage layout saved!');
      setEditingSectionId(null); // Close any open editor on save
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Could not save settings.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Loading settings...</p>;

  const availableSectionTypes: HomepageSection['type'][] = ['hero', 'services', 'customHtml', 'testimonials', 'portfolio'];

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Homepage Layout Management</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Add, remove, reorder, and configure sections for your homepage.
        </p>
      </div>

      <div className="my-4 flex space-x-2">
        {availableSectionTypes.map(type => (
            <button 
                key={type} 
                type="button" 
                onClick={() => addSection(type)} 
                className="px-3 py-1.5 text-sm border rounded bg-gray-100 hover:bg-gray-200 capitalize disabled:opacity-50"
                disabled={isSaving}
            >
                Add {type.replace(/([A-Z])/g, ' $1')} {/* Add space before caps */}
            </button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="homepageSections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4 border-t border-gray-200 pt-5"
            >
              {currentSections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(providedDraggable) => (
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      className="p-4 border rounded-md shadow-sm bg-white"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                           <button 
                             type="button" 
                             {...providedDraggable.dragHandleProps} 
                             className="p-1 mr-2 text-gray-500 hover:text-gray-700 cursor-grab"
                             aria-label="Drag to reorder"
                           >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                           </button>
                          <h4 className="font-semibold text-md capitalize">
                            {section.type.replace(/([A-Z])/g, ' $1')} Section
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(editingSectionId === section.id ? null : section.id)}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                            disabled={isSaving}
                          >
                            {editingSectionId === section.id ? 'Close Editor' : 'Configure'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSectionChange(section.id, { enabled: !section.enabled })}
                            className={`text-xs px-2 py-1 border rounded ${section.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                            disabled={isSaving}
                          >
                            {section.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => removeSection(section.id)} 
                            className="text-xs px-2 py-1 border rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                            disabled={isSaving}
                          >Remove</button>
                        </div>
                      </div>

                      {editingSectionId === section.id && (
                        <div className="mt-4 p-4 border-t bg-gray-50 rounded-b-md">
                          {React.createElement(sectionConfigMap[section.type], {
                            section: section,
                            onChange: (key, value) => handleSectionSettingsChange(section.id, key, value),
                            disabled: isSaving,
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {currentSections.length === 0 && (
        <p className="text-center text-gray-500 py-4">No homepage sections added yet. Click "Add Section" to get started.</p>
      )}

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving...' : 'Save Homepage Layout'}
          </button>
        </div>
      </div>
    </form>
  );
} 