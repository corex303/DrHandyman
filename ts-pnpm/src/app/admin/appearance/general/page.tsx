'use client';

import Image from 'next/image'; // For previews
import React, { useCallback, useEffect, useRef,useState } from 'react';
import { toast } from 'react-hot-toast';

interface AppearanceSettings {
  theme?: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  branding?: {
    logoUrl?: string;
    faviconUrl?: string;
  };
  // Add other appearance fields as necessary
}

// Predefined themes (can be expanded)
const availableThemes = [
  { id: 'light', name: 'Light Theme' },
  { id: 'dark', name: 'Dark Theme' }, // Example, actual CSS needs to support this
  { id: 'modern', name: 'Modern Theme' },
];

export default function GeneralAppearancePage() {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | undefined>(undefined);
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string | undefined>(undefined);

  // Refs for file inputs to reset them
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/appearance');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data: AppearanceSettings = await response.json();
      setSettings(data);
      setSelectedTheme(data.theme || availableThemes[0]?.id || '');
      setCurrentLogoUrl(data.branding?.logoUrl);
      setCurrentFaviconUrl(data.branding?.faviconUrl);
    } catch (error: any) {
      toast.error(error.message || 'Could not load settings.');
      console.error(error);
      setSelectedTheme(availableThemes[0]?.id || ''); // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return;

    if (type === 'logo') setIsUploadingLogo(true);
    if (type === 'favicon') setIsUploadingFavicon(true);
    toast.loading(`Uploading ${type}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Do not set Content-Type header, browser will do it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to upload ${type}`);
      }

      const result = await response.json();
      toast.dismiss();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
      
      if (type === 'logo') {
        setCurrentLogoUrl(result.url);
        if (logoInputRef.current) logoInputRef.current.value = ''; // Reset file input
      }
      if (type === 'favicon') {
        setCurrentFaviconUrl(result.url);
        if (faviconInputRef.current) faviconInputRef.current.value = ''; // Reset file input
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || `Could not upload ${type}.`);
      console.error(error);
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      if (type === 'favicon') setIsUploadingFavicon(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!settings) return;
    setIsSaving(true);
    toast.loading('Saving general settings...');

    const updatedSettingsPayload: AppearanceSettings = {
      ...settings, // Preserve other settings like colors, fonts etc.
      theme: selectedTheme,
      branding: {
        ...(settings.branding || {}),
        logoUrl: currentLogoUrl,
        faviconUrl: currentFaviconUrl,
      },
    };

    try {
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
      setSelectedTheme(updatedData.theme || availableThemes[0]?.id || '');
      setCurrentLogoUrl(updatedData.branding?.logoUrl);
      setCurrentFaviconUrl(updatedData.branding?.faviconUrl);
      toast.dismiss();
      toast.success('General settings saved!');
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
      <div className="space-y-6 sm:space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">General Site Appearance</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage global theme, site logo, and favicon.
          </p>
        </div>

        {/* Theme Selection */}
        <div className="space-y-6 sm:space-y-5 border-t border-gray-200 pt-5">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Site Theme
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <select
                id="theme"
                name="theme"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              >
                {availableThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-6 sm:space-y-5 border-t border-gray-200 pt-5">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Site Logo
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              {currentLogoUrl && (
                <div className="mb-2">
                  <Image src={currentLogoUrl} alt="Current logo preview" width={150} height={50} className="object-contain border rounded" />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                name="logoUrl"
                id="logoUrl"
                accept="image/png, image/jpeg, image/svg+xml, image/gif"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0], 'logo')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                disabled={isSaving || isUploadingLogo}
              />
              {isUploadingLogo && <p className="text-sm text-indigo-600 mt-1">Uploading logo...</p>}
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, SVG. Max 5MB. Recommended aspect ratio: 3:1 (e.g., 300x100px).</p>
            </div>
          </div>
        </div>

        {/* Favicon Upload */}
        <div className="space-y-6 sm:space-y-5 border-t border-gray-200 pt-5">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
            <label htmlFor="faviconUrl" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Site Favicon
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              {currentFaviconUrl && (
                <div className="mb-2">
                  <Image src={currentFaviconUrl} alt="Current favicon preview" width={32} height={32} className="border rounded" />
                </div>
              )}
              <input
                ref={faviconInputRef}
                type="file"
                name="faviconUrl"
                id="faviconUrl"
                accept="image/png, image/x-icon, image/svg+xml"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0], 'favicon')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                disabled={isSaving || isUploadingFavicon}
              />
              {isUploadingFavicon && <p className="text-sm text-indigo-600 mt-1">Uploading favicon...</p>}
              <p className="mt-1 text-xs text-gray-500">PNG, ICO, SVG. Max 5MB. Recommended size: 32x32px or 64x64px.</p>
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
            disabled={isSaving || isLoading || isUploadingLogo || isUploadingFavicon}
          >
            {isSaving ? 'Saving...' : (isUploadingLogo || isUploadingFavicon ? 'Uploading...' : 'Save Settings')}
          </button>
        </div>
      </div>
    </form>
  );
} 