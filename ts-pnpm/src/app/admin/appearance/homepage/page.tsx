'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { toast } from 'react-hot-toast';
import SectionEditor from '@/components/admin/appearance/SectionEditor';
import SectionConfigurator from '@/components/admin/appearance/homepage/SectionConfigurator';
import { HomepageSection } from '@/components/admin/appearance/homepage/HeroConfig';
import { Button } from '@nextui-org/react';
import { FiPlus } from 'react-icons/fi';

// --- Interfaces ---
interface AppearanceSettings {
  homepageSections?: HomepageSection[];
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
        throw new Error('Failed to save settings. Please try again.');
      }

      const savedData = await response.json();
      setSettings(savedData);
      setCurrentSections(savedData.homepageSections || []);
      toast.dismiss();
      toast.success('Homepage layout saved!');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Homepage Sections</h3>
            <p className="mt-1 text-sm text-gray-500">Drag and drop to reorder sections on your homepage.</p>
        </div>
        <Button onClick={handleSaveChanges} color="primary" isLoading={isSaving} disabled={isSaving}>
          Save Changes
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {currentSections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(providedDraggable) => (
                    <SectionEditor
                      title={section.settings.title || 'Untitled Section'}
                      type={section.type}
                      isEnabled={section.enabled}
                      onToggle={(isEnabled) => handleSectionChange(section.id, { enabled: isEnabled })}
                      onRemove={() => removeSection(section.id)}
                      draggableProvided={providedDraggable}
                    >
                      <SectionConfigurator
                        section={section}
                        onChange={(key, value) => handleSectionSettingsChange(section.id, key, value)}
                        disabled={!section.enabled}
                      />
                    </SectionEditor>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-800 mb-2">Add New Section</h4>
        <div className="flex flex-wrap gap-2">
            {(['hero', 'services', 'customHtml', 'testimonials', 'portfolio'] as HomepageSection['type'][]).map(type => (
                <Button key={type} size="sm" variant="bordered" onClick={() => addSection(type)} startContent={<FiPlus />}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
            ))}
        </div>
      </div>
    </div>
  );
} 