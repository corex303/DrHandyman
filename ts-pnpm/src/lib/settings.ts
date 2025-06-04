import prisma from '@/lib/prisma';

import { AppearanceSettings, defaultAppearanceSettings } from '@/types/appearance';

// Define a local type for clarity, matching the structure of subLinks items
interface ServiceSubLink {
  id: string;
  text: string;
  href: string;
  iconSrc?: string;
}

// Define a local type for top-level navigation links
interface TopLevelNavLink {
  id: string;
  text: string;
  href: string;
  iconSrc?: string;
  subLinks?: ServiceSubLink[];
}

export async function getSiteAppearanceSettings(): Promise<AppearanceSettings> {
  try {
    const settingsPromise = prisma.siteSettings.findFirst();
    const servicesPromise = prisma.service.findMany({
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const [settings, services] = await Promise.all([settingsPromise, servicesPromise]);

    const serviceSubmenuLinks: ServiceSubLink[] = services.map(service => ({
      id: `service-${service.slug}`,
      text: service.name,
      href: `/services/${service.slug}`,
    }));

    // Function to inject submenu into a navLinks array
    const injectSubmenu = (navLinksArray: TopLevelNavLink[] | undefined): TopLevelNavLink[] | undefined => {
      if (navLinksArray) {
        const servicesMainLinkIndex = navLinksArray.findIndex(
          (link: TopLevelNavLink) => link.href === '/services' || link.text === 'Services'
        );
        if (servicesMainLinkIndex !== -1) {
          navLinksArray[servicesMainLinkIndex].subLinks = serviceSubmenuLinks;
        }
      }
      return navLinksArray;
    };

    if (!settings || typeof settings.appearance !== 'object' || settings.appearance === null) {
      console.warn('SiteSettings not found or appearance data is not a valid object. Using fallback defaults.');
      const defaultWithServices = JSON.parse(JSON.stringify(defaultAppearanceSettings)); // Deep clone
      if (defaultWithServices.header) {
        // Ensure navLinks exists on header before trying to inject
        if (!defaultWithServices.header.navLinks) {
          defaultWithServices.header.navLinks = [];
        }
        defaultWithServices.header.navLinks = injectSubmenu(defaultWithServices.header.navLinks as TopLevelNavLink[] | undefined);
      } else {
        // If header itself is missing in defaults (shouldn't happen based on defaultAppearanceSettings type)
        defaultWithServices.header = { navLinks: injectSubmenu([]) };
      }
      return defaultWithServices;
    }

    const dbAppearance = settings.appearance as Partial<AppearanceSettings>;
    let mergedSettings: AppearanceSettings = JSON.parse(JSON.stringify(defaultAppearanceSettings)); // Deep clone for base

    mergedSettings = {
      ...mergedSettings,
      ...dbAppearance,
      colors: {
        ...mergedSettings.colors,
        ...(dbAppearance.colors || {}),
      },
      fonts: {
        ...mergedSettings.fonts,
        ...(dbAppearance.fonts || {}),
      },
      header: {
        ...mergedSettings.header, // Base from default clone
        ...(dbAppearance.header || {}), // Overlay with DB header settings
        // Initialize navLinks from DB or default, then inject submenu
        navLinks: injectSubmenu(
          dbAppearance.header?.navLinks 
            ? [...dbAppearance.header.navLinks] 
            : (mergedSettings.header?.navLinks ? [...mergedSettings.header.navLinks] : [])
        ) as TopLevelNavLink[] | undefined,
      },
      footer: {
        ...mergedSettings.footer,
        ...(dbAppearance.footer || {}),
        linkColumns: dbAppearance.footer?.linkColumns || mergedSettings.footer?.linkColumns,
      },
      homepage: {
        ...mergedSettings.homepage,
        ...(dbAppearance.homepage || {}),
        layout: dbAppearance.homepage?.layout || mergedSettings.homepage?.layout,
      },
    };
            
    return mergedSettings;

  } catch (error) {
    console.error('Error fetching site settings or services:', error);
    const defaultWithServicesOnError = JSON.parse(JSON.stringify(defaultAppearanceSettings));
    try {
      const servicesOnError = await prisma.service.findMany({ select: { name: true, slug: true }, orderBy: {name: 'asc'}});
      const serviceSubmenuOnError: ServiceSubLink[] = servicesOnError.map(s => ({id: `service-${s.slug}`, text: s.name, href: `/services/${s.slug}`}));
      
      if (!defaultWithServicesOnError.header) {
        defaultWithServicesOnError.header = {}; // Ensure header object exists
      }
      if (!defaultWithServicesOnError.header.navLinks) {
        defaultWithServicesOnError.header.navLinks = []; 
      }
      const navLinksForErrorFallback = defaultWithServicesOnError.header.navLinks as TopLevelNavLink[];
      const servicesMainLinkIndex = navLinksForErrorFallback.findIndex(
        (link: TopLevelNavLink) => link.href === '/services' || link.text === 'Services'
      );
      if (servicesMainLinkIndex !== -1) {
        navLinksForErrorFallback[servicesMainLinkIndex].subLinks = serviceSubmenuOnError;
      } else {
        navLinksForErrorFallback.push({
          id: 'services-dynamic-fallback',
          text: 'Services',
          href: '/services',
          subLinks: serviceSubmenuOnError,
        });
      }
    } catch (serviceError) {
      console.error('Could not fetch services during error fallback:', serviceError);
    }
    return defaultWithServicesOnError;
  }
} 