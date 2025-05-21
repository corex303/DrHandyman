import prisma from '@/lib/prisma';
import { AppearanceSettings, defaultAppearanceSettings } from '@/types/appearance';

export async function getSiteAppearanceSettings(): Promise<AppearanceSettings> {
  try {
    const settings = await prisma.siteSettings.findFirst();
    
    if (!settings || typeof settings.appearance !== 'object' || settings.appearance === null) {
      console.warn('SiteSettings not found or appearance data is not a valid object. Using fallback defaults.');
      return defaultAppearanceSettings;
    }

    // Cast the JsonValue to Partial<AppearanceSettings>
    const dbAppearance = settings.appearance as Partial<AppearanceSettings>;

    // Deep merge with defaults to ensure all keys are present and defaults are applied correctly
    const mergedSettings: AppearanceSettings = {
      ...defaultAppearanceSettings,
      ...dbAppearance,
      colors: { 
        ...defaultAppearanceSettings.colors,
        ...(dbAppearance.colors || {}),
      },
      fonts: { 
        ...defaultAppearanceSettings.fonts,
        ...(dbAppearance.fonts || {}),
      },
      header: { 
        ...defaultAppearanceSettings.header,
        ...(dbAppearance.header || {}),
        navLinks: dbAppearance.header?.navLinks || defaultAppearanceSettings.header?.navLinks,
      },
      footer: { 
        ...defaultAppearanceSettings.footer,
        ...(dbAppearance.footer || {}),
        linkColumns: dbAppearance.footer?.linkColumns || defaultAppearanceSettings.footer?.linkColumns,
      },
      homepage: { 
        ...defaultAppearanceSettings.homepage,
        ...(dbAppearance.homepage || {}),
        layout: dbAppearance.homepage?.layout || defaultAppearanceSettings.homepage?.layout,
      },
    };
    
    return mergedSettings;

  } catch (error) {
    console.error('Error fetching site settings:', error);
    return defaultAppearanceSettings; // Fallback in case of error
  }
} 