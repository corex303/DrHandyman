'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AppearanceSettings, HeaderSettings, FooterSettings } from '@/components/admin/appearance/header-footer/types';
import HeaderEditor from '@/components/admin/appearance/header-footer/HeaderEditor';
import FooterEditor from '@/components/admin/appearance/header-footer/FooterEditor';
import { Button, Spinner } from '@nextui-org/react';

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
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

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
            setCurrentHeader(prev => ({ ...defaultHeaderSettings, ...(updatedData.header || {}) }));
            setCurrentFooter(prev => ({ ...defaultFooterSettings, ...(updatedData.footer || {}) }));
            toast.dismiss();
            toast.success('Header & footer settings saved!');
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message || 'Could not save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Spinner label="Loading settings..." />
            </div>
        );
    }

    if (!settings) {
        return <p>Could not load appearance settings. Try refreshing.</p>;
    }

    return (
        <div className="space-y-8">
            <HeaderEditor 
                initialSettings={currentHeader}
                onSettingsChange={setCurrentHeader}
                isSaving={isSaving}
            />
            <FooterEditor
                initialSettings={currentFooter}
                onSettingsChange={setCurrentFooter}
                isSaving={isSaving}
            />
             <div className="pt-5 flex justify-end">
                <Button color="primary" onClick={handleSaveChanges} isLoading={isSaving} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
            </div>
        </div>
    );
} 