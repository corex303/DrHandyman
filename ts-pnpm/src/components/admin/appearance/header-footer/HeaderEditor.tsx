'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HeaderSettings } from './types';
import { Button, Input, Switch } from '@nextui-org/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface HeaderEditorProps {
  initialSettings: HeaderSettings;
  onSettingsChange: (newSettings: HeaderSettings) => void;
  isSaving: boolean;
}

const defaultHeaderSettings: HeaderSettings = {
  layout: 'logoLeft_navRight',
  navLinks: [],
  cta: { text: '', url: '', visible: false },
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  sticky: true,
};

export default function HeaderEditor({ initialSettings, onSettingsChange, isSaving }: HeaderEditorProps) {
  const [currentHeader, setCurrentHeader] = useState<HeaderSettings>({
    ...defaultHeaderSettings,
    ...initialSettings,
  });

  // State for new nav link inputs
  const [newNavLinkText, setNewNavLinkText] = useState('');
  const [newNavLinkUrl, setNewNavLinkUrl] = useState('');
  const [newNavLinkNewTab, setNewNavLinkNewTab] = useState(false);

  const handleChange = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
    const newSettings = { ...currentHeader, [key]: value };
    setCurrentHeader(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleNavLinkChange = (index: number, field: 'text' | 'url' | 'newTab', value: string | boolean) => {
    const updatedNavLinks = [...(currentHeader.navLinks || [])];
    if (updatedNavLinks[index]) {
      (updatedNavLinks[index] as any)[field] = value;
      handleChange('navLinks', updatedNavLinks);
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
    handleChange('navLinks', [...(currentHeader.navLinks || []), newLink]);
    setNewNavLinkText('');
    setNewNavLinkUrl('');
    setNewNavLinkNewTab(false);
  };

  const removeNavLink = (id: string) => {
    handleChange('navLinks', (currentHeader.navLinks || []).filter(link => link.id !== id));
  };


  return (
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
              onChange={(e) => handleChange('layout', e.target.value)}
              className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isSaving}
            >
              <option value="logoLeft_navRight">Logo Left, Nav Right</option>
              <option value="logoCenter_navBelow">Logo Center, Nav Below</option>
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
                <Input
                  label="Link Text"
                  value={link.text}
                  onValueChange={(value) => handleNavLinkChange(index, 'text', value)}
                  size="sm"
                  isDisabled={isSaving}
                />
                <Input
                  label="URL"
                  value={link.url}
                  onValueChange={(value) => handleNavLinkChange(index, 'url', value)}
                  size="sm"
                  isDisabled={isSaving}
                />
                <Switch
                    isSelected={link.newTab}
                    onValueChange={(isSelected) => handleNavLinkChange(index, 'newTab', isSelected)}
                    size="sm"
                >New Tab</Switch>
                <Button isIconOnly variant="light" color="danger" onClick={() => removeNavLink(link.id)} isDisabled={isSaving} size='sm'>
                    <FiTrash2 />
                </Button>
              </div>
            ))}
            <div className="flex items-end gap-2 pt-2 border-t mt-2">
                <Input
                    label="New Link Text"
                    value={newNavLinkText}
                    onValueChange={setNewNavLinkText}
                    size="sm"
                    isDisabled={isSaving}
                />
                <Input
                    label="New Link URL"
                    value={newNavLinkUrl}
                    onValueChange={setNewNavLinkUrl}
                    size="sm"
                    isDisabled={isSaving}
                />
                <Switch
                    isSelected={newNavLinkNewTab}
                    onValueChange={setNewNavLinkNewTab}
                    size="sm"
                >New Tab</Switch>
              <Button onClick={addNavLink} isDisabled={isSaving} size="sm" color='primary' startContent={<FiPlus/>}>Add Link</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 