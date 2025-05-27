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
  header?: HeaderSettings;
  footer?: FooterSettings;
}

interface HeaderSettings {
  layout?: string;
  navLinks?: Array<{ id: string; text: string; url: string; newTab?: boolean }>;
  cta?: { text?: string; url?: string; visible?: boolean };
  backgroundColor?: string;
  textColor?: string;
  sticky?: boolean;
}

interface FooterSettings {
  layout?: string; // e.g., '1-column', '4-columns'
  copyrightText?: string;
  showSocialLinks?: boolean;
  footerLinks?: Array<{ id: string; text: string; url: string; newTab?: boolean }>;
  showContactInfo?: boolean;
  customHtml?: string;
  backgroundColor?: string;
  textColor?: string;
}

const defaultHeaderSettings: HeaderSettings = {
  layout: 'logoLeft_navRight',
  navLinks: [],
  cta: { text: '', url: '', visible: false },
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  sticky: true,
};

const defaultFooterSettings: FooterSettings = {
  layout: '4-columns',
  copyrightText: `© ${new Date().getFullYear()} Dr. Handyman NC. All rights reserved.`,
  showSocialLinks: true,
  footerLinks: [],
  showContactInfo: true,
  customHtml: '',
  backgroundColor: '#111827',
  textColor: '#FFFFFF',
};

export default function HeaderFooterAppearancePage() {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [currentHeader, setCurrentHeader] = useState<HeaderSettings>(defaultHeaderSettings);
  const [currentFooter, setCurrentFooter] = useState<FooterSettings>(defaultFooterSettings);

  // Add state for new nav link inputs
  const [newNavLinkText, setNewNavLinkText] = useState('');
  const [newNavLinkUrl, setNewNavLinkUrl] = useState('');
  const [newNavLinkNewTab, setNewNavLinkNewTab] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/appearance');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data: AppearanceSettings = await response.json();
      setSettings(data);
      setCurrentHeader(prev => ({ ...defaultHeaderSettings, ...(data.header || {}) }));
      setCurrentFooter(prev => ({ ...defaultFooterSettings, ...(data.footer || {}) }));
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

  const handleHeaderChange = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
    setCurrentHeader(prev => ({ ...prev, [key]: value }));
  };

  const handleFooterChange = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setCurrentFooter(prev => ({ ...prev, [key]: value }));
  };

  const handleNavLinkChange = (index: number, field: 'text' | 'url' | 'newTab', value: string | boolean) => {
    const updatedNavLinks = [...(currentHeader.navLinks || [])];
    if (updatedNavLinks[index]) {
      (updatedNavLinks[index] as any)[field] = value;
      handleHeaderChange('navLinks', updatedNavLinks);
    }
  };

  const addNavLink = () => {
    if (!newNavLinkText.trim() || !newNavLinkUrl.trim()) {
      toast.error('Nav link text and URL cannot be empty.');
      return;
    }
    const newLink = { 
      id: `nav-${Date.now()}`,
      text: newNavLinkText, 
      url: newNavLinkUrl, 
      newTab: newNavLinkNewTab 
    };
    handleHeaderChange('navLinks', [...(currentHeader.navLinks || []), newLink]);
    setNewNavLinkText('');
    setNewNavLinkUrl('');
    setNewNavLinkNewTab(false);
  };

  const removeNavLink = (id: string) => {
    handleHeaderChange('navLinks', (currentHeader.navLinks || []).filter(link => link.id !== id));
  };

  const handleSaveChanges = async () => {
    if (!settings) return;
    setIsSaving(true);
    toast.loading('Saving header & footer settings...');

    try {
      const updatedSettingsPayload: AppearanceSettings = {
        ...settings,
        header: currentHeader,
        footer: currentFooter,
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
      // Ensure defaults are applied if parts of header/footer are missing from response
      setCurrentHeader(prev => ({ ...defaultHeaderSettings, ...(updatedData.header || {}) }));
      setCurrentFooter(prev => ({ ...defaultFooterSettings, ...(updatedData.footer || {}) }));
      toast.dismiss();
      toast.success('Header & footer settings saved!');
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
      {/* Header Settings Section */}
      <div className="space-y-6 sm:space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Header Customization</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure your website header layout, navigation, and styling.
          </p>
        </div>
        <div className="space-y-6 sm:space-y-5 border-t border-gray-200 pt-5">
          {/* Header Layout */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
            <label htmlFor="headerLayout" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Header Layout
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <select
                id="headerLayout"
                name="headerLayout"
                value={currentHeader.layout || 'logoLeft_navRight'}
                onChange={(e) => handleHeaderChange('layout', e.target.value)}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              >
                <option value="logoLeft_navRight">Logo Left, Nav Right</option>
                <option value="logoCenter_navBelow">Logo Center, Nav Below</option>
                {/* Add more predefined layouts as needed */}
              </select>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Navigation Links
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2 space-y-3">
              {(currentHeader.navLinks || []).map((link, index) => (
                <div key={link.id} className="flex items-center gap-2 p-2 border rounded-md">
                  <input
                    type="text"
                    placeholder="Link Text"
                    value={link.text}
                    onChange={(e) => handleNavLinkChange(index, 'text', e.target.value)}
                    className="flex-grow rounded-md border-gray-300 shadow-sm sm:text-sm"
                    disabled={isSaving}
                  />
                  <input
                    type="url"
                    placeholder="URL (e.g., /about)"
                    value={link.url}
                    onChange={(e) => handleNavLinkChange(index, 'url', e.target.value)}
                    className="flex-grow rounded-md border-gray-300 shadow-sm sm:text-sm"
                    disabled={isSaving}
                  />
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      checked={link.newTab || false} 
                      onChange={(e) => handleNavLinkChange(index, 'newTab', e.target.checked)}
                      className="rounded h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-1"
                      disabled={isSaving}
                    /> Open in new tab
                  </label>
                  <button 
                    type="button" 
                    onClick={() => removeNavLink(link.id)} 
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    disabled={isSaving}
                  >Remove</button>
                </div>
              ))}
              <div className="flex items-end gap-2 pt-2 border-t mt-2">
                <div className='flex-grow'>
                  <label htmlFor="newNavLinkText" className="block text-xs font-medium text-gray-500">New Link Text</label>
                  <input
                    id="newNavLinkText"
                    type="text"
                    placeholder="Link Text"
                    value={newNavLinkText}
                    onChange={(e) => setNewNavLinkText(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                    disabled={isSaving}
                  />
                </div>
                <div className='flex-grow'>
                 <label htmlFor="newNavLinkUrl" className="block text-xs font-medium text-gray-500">New Link URL</label>
                  <input
                    id="newNavLinkUrl"
                    type="url"
                    placeholder="URL"
                    value={newNavLinkUrl}
                    onChange={(e) => setNewNavLinkUrl(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                    disabled={isSaving}
                  />
                </div>
                <label className="flex items-center text-sm whitespace-nowrap pt-5">
                    <input 
                      type="checkbox" 
                      checked={newNavLinkNewTab} 
                      onChange={(e) => setNewNavLinkNewTab(e.target.checked)}
                      className="rounded h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-1"
                      disabled={isSaving}
                    /> New Tab
                  </label>
                <button 
                  type="button" 
                  onClick={addNavLink} 
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50"
                  disabled={isSaving}
                >Add Link</button>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              CTA Button
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  id="ctaVisible"
                  type="checkbox"
                  checked={currentHeader.cta?.visible || false}
                  onChange={(e) => handleHeaderChange('cta', { ...currentHeader.cta, visible: e.target.checked })}
                  className="rounded h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-2"
                  disabled={isSaving}
                />
                <label htmlFor="ctaVisible" className="text-sm text-gray-700">Show CTA Button</label>
              </div>
              {currentHeader.cta?.visible && (
                <>
                  <div>
                    <label htmlFor="ctaText" className="block text-xs font-medium text-gray-500">CTA Text</label>
                    <input
                      type="text"
                      name="ctaText"
                      id="ctaText"
                      value={currentHeader.cta?.text || ''}
                      onChange={(e) => handleHeaderChange('cta', { ...currentHeader.cta, text: e.target.value })}
                      className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label htmlFor="ctaUrl" className="block text-xs font-medium text-gray-500">CTA URL</label>
                    <input
                      type="url"
                      name="ctaUrl"
                      id="ctaUrl"
                      value={currentHeader.cta?.url || ''}
                      onChange={(e) => handleHeaderChange('cta', { ...currentHeader.cta, url: e.target.value })}
                      className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={isSaving}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Header Styling */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Header Styling
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2 space-y-3">
              <div className="flex items-center gap-x-4">
                <div>
                    <label htmlFor="headerBgColor" className="block text-xs font-medium text-gray-500">Background Color</label>
                    <input
                    type="color"
                    name="headerBgColor"
                    id="headerBgColor"
                    value={currentHeader.backgroundColor || '#FFFFFF'}
                    onChange={(e) => handleHeaderChange('backgroundColor', e.target.value)}
                    className="block h-10 w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSaving}
                    />
                </div>
                <div>
                    <label htmlFor="headerTextColor" className="block text-xs font-medium text-gray-500">Text Color</label>
                    <input
                    type="color"
                    name="headerTextColor"
                    id="headerTextColor"
                    value={currentHeader.textColor || '#111827'}
                    onChange={(e) => handleHeaderChange('textColor', e.target.value)}
                    className="block h-10 w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSaving}
                    />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="headerSticky"
                  type="checkbox"
                  checked={currentHeader.sticky || false}
                  onChange={(e) => handleHeaderChange('sticky', e.target.checked)}
                  className="rounded h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-2"
                  disabled={isSaving}
                />
                <label htmlFor="headerSticky" className="text-sm text-gray-700">Sticky Header</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Settings Section */}
      <div className="space-y-6 pt-8 sm:space-y-5 sm:pt-10">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Footer Customization</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure your website footer layout, content, and styling.
          </p>
        </div>
        <div className="space-y-6 sm:space-y-5 border-t border-gray-200 pt-5">
          {/* Footer Layout */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
            <label htmlFor="footerLayout" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Footer Layout
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <select
                id="footerLayout"
                name="footerLayout"
                value={currentFooter.layout || '4-columns'}
                onChange={(e) => handleFooterChange('layout', e.target.value)}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              >
                <option value="1-column">1 Column</option>
                <option value="2-columns">2 Columns</option>
                <option value="3-columns">3 Columns</option>
                <option value="4-columns">4 Columns</option>
                {/* Add more predefined layouts as needed */}
              </select>
            </div>
          </div>

          {/* Copyright Text */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="footerCopyright" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Copyright Text
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="text"
                name="footerCopyright"
                id="footerCopyright"
                value={currentFooter.copyrightText || ''}
                onChange={(e) => handleFooterChange('copyrightText', e.target.value)}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`e.g., © ${new Date().getFullYear()} Your Company`}
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-gray-500">Use `{'{year}'}` for dynamic year.</p>
            </div>
          </div>

          {/* Social Media Links Toggle */}
           <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="showSocialLinks" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Display Options
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2 space-y-2">
                <div className="flex items-center">
                    <input
                    id="showSocialLinks"
                    type="checkbox"
                    checked={currentFooter.showSocialLinks || false}
                    onChange={(e) => handleFooterChange('showSocialLinks', e.target.checked)}
                    className="rounded h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-2"
                    disabled={isSaving}
                    />
                    <label htmlFor="showSocialLinks" className="text-sm text-gray-700">Show Social Media Links</label>
                </div>
                {/* Contact Info Toggle */}
                <div className="flex items-center">
                    <input
                    id="showContactInfo"
                    type="checkbox"
                    checked={currentFooter.showContactInfo || false}
                    onChange={(e) => handleFooterChange('showContactInfo', e.target.checked)}
                    className="rounded h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-2"
                    disabled={isSaving}
                    />
                    <label htmlFor="showContactInfo" className="text-sm text-gray-700">Show Contact Info</label>
                </div>
            </div>
          </div>

          {/* Footer Links (similar to header nav links) - This needs a separate state and handlers */}
          {/* For simplicity, we'll omit the dynamic add/remove for footer links in this step and assume they are managed elsewhere or hardcoded */}
          {/* A full implementation would mirror the header's navLink management */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Footer Links
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <p className="text-sm text-gray-500 italic"> (Management for dynamic footer links - e.g., quick links, policies - can be added here similar to header navigation.)</p>
              {/* Placeholder for actual footer link management UI */}
            </div>
          </div>

          {/* Custom HTML */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="footerCustomHtml" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Custom Footer HTML
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <textarea
                id="footerCustomHtml"
                name="footerCustomHtml"
                rows={4}
                value={currentFooter.customHtml || ''}
                onChange={(e) => handleFooterChange('customHtml', e.target.value)}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter any custom HTML for the footer..."
                disabled={isSaving}
              />
            </div>
          </div>
          
          {/* Footer Styling */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Footer Styling
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2 space-y-3">
              <div className="flex items-center gap-x-4">
                 <div>
                    <label htmlFor="footerBgColor" className="block text-xs font-medium text-gray-500">Background Color</label>
                    <input
                    type="color"
                    name="footerBgColor"
                    id="footerBgColor"
                    value={currentFooter.backgroundColor || '#111827'}
                    onChange={(e) => handleFooterChange('backgroundColor', e.target.value)}
                    className="block h-10 w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSaving}
                    />
                </div>
                <div>
                    <label htmlFor="footerTextColor" className="block text-xs font-medium text-gray-500">Text Color</label>
                    <input
                    type="color"
                    name="footerTextColor"
                    id="footerTextColor"
                    value={currentFooter.textColor || '#FFFFFF'}
                    onChange={(e) => handleFooterChange('textColor', e.target.value)}
                    className="block h-10 w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSaving}
                    />
                </div>    
              </div>
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
            {isSaving ? 'Saving...' : 'Save Header & Footer Settings'}
          </button>
        </div>
      </div>
    </form>
  );
} 