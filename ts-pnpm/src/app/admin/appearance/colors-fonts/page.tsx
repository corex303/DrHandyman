'use client';

import React, { useCallback,useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Assuming AppearanceSettings interface is defined (can be imported from a shared types file)
interface AppearanceSettings {
  theme?: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  branding?: {
    logoUrl?: string;
    faviconUrl?: string;
  };
}

const defaultColors: Record<string, string> = {
  primary: '#4F46E5', // Indigo 600
  secondary: '#6B7280', // Gray 500
  accent: '#EC4899',    // Pink 500
  textBody: '#111827',  // Gray 900
  textHeading: '#111827',// Gray 900
  backgroundSite: '#F9FAFB', // Gray 50
  backgroundSection: '#FFFFFF', // White
};

const availableFontFamilies = [
  { id: 'system-ui, sans-serif', name: 'System UI' },
  { id: 'Arial, sans-serif', name: 'Arial' },
  { id: 'Helvetica, sans-serif', name: 'Helvetica' },
  { id: 'Georgia, serif', name: 'Georgia' },
  { id: 'Times New Roman, serif', name: 'Times New Roman' },
  { id: 'Inter, sans-serif', name: 'Inter' },
  { id: 'Roboto, sans-serif', name: 'Roboto' },
];

const defaultFonts = {
  global: availableFontFamilies[0].id,
  headings: availableFontFamilies[0].id,
};

export default function ColorsFontsAppearancePage() {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentColors, setCurrentColors] = useState<Record<string, string>>(defaultColors);
  const [currentFonts, setCurrentFonts] = useState(defaultFonts);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/appearance');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data: AppearanceSettings = await response.json();
      setSettings(data);
      setCurrentColors(data.colors || defaultColors);
      if (data.fonts && typeof data.fonts.global === 'string' && typeof data.fonts.headings === 'string') {
        setCurrentFonts(data.fonts as { global: string; headings: string });
      } else {
        setCurrentFonts(defaultFonts);
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not load settings.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleColorChange = (colorName: string, value: string) => {
    setCurrentColors(prev => ({ ...prev, [colorName]: value }));
  };

  const handleFontChange = (fontType: 'global' | 'headings', value: string) => {
    setCurrentFonts(prev => ({ ...prev, [fontType]: value }));
  };

  const handleSaveChanges = async () => {
    if (!settings) return;
    setIsSaving(true);
    toast.loading('Saving color & font settings...');

    try {
      const updatedSettingsPayload: AppearanceSettings = {
        ...settings,
        colors: currentColors,
        fonts: currentFonts,
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
      setCurrentColors(updatedData.colors || defaultColors);
      if (updatedData.fonts && typeof updatedData.fonts.global === 'string' && typeof updatedData.fonts.headings === 'string') {
        setCurrentFonts(updatedData.fonts as { global: string; headings: string });
      } else {
        setCurrentFonts(defaultFonts);
      }
      toast.dismiss();
      toast.success('Color & font settings saved!');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Could not save settings.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Loading settings...</p>;
  if (!settings) return <p>Could not load appearance settings. Try refreshing.</p>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="space-y-8 divide-y divide-gray-200">
      {/* Colors Section */}
      <div className="space-y-6 sm:space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Color Palette</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Define the main colors for your website.
          </p>
        </div>
        <div className="space-y-6 sm:space-y-5">
          {Object.entries(currentColors).map(([name, value]) => (
            <div key={name} className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center sm:border-t sm:border-gray-200 sm:pt-5">
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2 capitalize">
                {name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2 flex items-center">
                <input
                  type="color"
                  id={name}
                  name={name}
                  value={value}
                  onChange={(e) => handleColorChange(name, e.target.value)}
                  className="h-10 w-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1"
                  disabled={isSaving}
                />
                <input 
                  type="text"
                  value={value.toUpperCase()}
                  onChange={(e) => handleColorChange(name, e.target.value)} // Basic validation for hex could be added
                  className="ml-3 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  disabled={isSaving}
                  maxLength={7}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts Section */}
      <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Typography</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Choose the font families for your site content.
          </p>
        </div>
        <div className="space-y-6 sm:space-y-5">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="globalFont" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Global Font (Body)
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <select
                id="globalFont"
                name="globalFont"
                value={currentFonts.global}
                onChange={(e) => handleFontChange('global', e.target.value)}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                disabled={isSaving}
              >
                {availableFontFamilies.map(font => (
                  <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>{font.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="headingsFont" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Headings Font
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <select
                id="headingsFont"
                name="headingsFont"
                value={currentFonts.headings}
                onChange={(e) => handleFontChange('headings', e.target.value)}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs sm:text-sm"
                disabled={isSaving}
              >
                {availableFontFamilies.map(font => (
                  <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>{font.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </form>
  );
} 