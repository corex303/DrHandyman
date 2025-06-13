'use client';

import React, { useState } from 'react';
import { FooterSettings } from './types';
import { Input, Switch, Textarea } from '@nextui-org/react';

interface FooterEditorProps {
  initialSettings: FooterSettings;
  onSettingsChange: (newSettings: FooterSettings) => void;
  isSaving: boolean;
}

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

export default function FooterEditor({ initialSettings, onSettingsChange, isSaving }: FooterEditorProps) {
  const [currentFooter, setCurrentFooter] = useState<FooterSettings>({
    ...defaultFooterSettings,
    ...initialSettings,
  });

  const handleChange = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    const newSettings = { ...currentFooter, [key]: value };
    setCurrentFooter(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="space-y-6 sm:space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Footer Customization</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Adjust your website footer content and appearance.
          </p>
        </div>
        <div className="space-y-6 sm:space-y-5 border-t border-gray-200 pt-5">
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                <label htmlFor="footerLayout" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Footer Layout
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                <select
                    id="footerLayout"
                    name="footerLayout"
                    value={currentFooter.layout || '4-columns'}
                    onChange={(e) => handleChange('layout', e.target.value)}
                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={isSaving}
                >
                    <option value="4-columns">4 Columns</option>
                    <option value="1-column-centered">1 Column, Centered</option>
                    <option value="simple-links">Simple Links</option>
                </select>
                </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="copyrightText" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Copyright Text
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                <Input
                    id="copyrightText"
                    value={currentFooter.copyrightText || ''}
                    onValueChange={(value) => handleChange('copyrightText', value)}
                    isDisabled={isSaving}
                />
                </div>
            </div>
            
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="showSocialLinks" className="block text-sm font-medium text-gray-700">
                    Show Social Links
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                    <Switch
                        id='showSocialLinks'
                        isSelected={currentFooter.showSocialLinks}
                        onValueChange={(isSelected) => handleChange('showSocialLinks', isSelected)}
                        disabled={isSaving}
                    />
                </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="customHtml" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Custom Footer HTML
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                <Textarea
                    id="customHtml"
                    value={currentFooter.customHtml || ''}
                    onValueChange={(value) => handleChange('customHtml', value)}
                    placeholder="Add any raw HTML like tracking scripts or custom elements."
                    isDisabled={isSaving}
                    minRows={4}
                />
                </div>
            </div>
        </div>
    </div>
  );
} 