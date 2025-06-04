'use client';

import { useRef,useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';

import { AppearanceSettings, defaultAppearanceSettings } from '@/types/appearance';

interface HeaderProps {
  appearanceSettings?: AppearanceSettings;
}

const Header = ({ appearanceSettings: propsAppearanceSettings }: HeaderProps) => {
  const appearanceSettings = { ...defaultAppearanceSettings, ...propsAppearanceSettings };
  const headerSettings = { ...defaultAppearanceSettings.header, ...appearanceSettings.header };
  // const logoUrl = appearanceSettings.logoUrl || '/images/dr-handyman-logo-transparent.png'; // Logo URL no longer needed here

  // Ensure "Services" link is present
  const finalNavLinks = [...(headerSettings.navLinks || [])];
  const servicesLinkExists = finalNavLinks.some(link => link.href === '/services');
  if (!servicesLinkExists) {
    finalNavLinks.push({ id: 'services-link', text: 'Services', href: '/services' });
  }

  const [isOpen, setIsOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full shadow-md bg-primary-navy text-text-light"
    >
      <div className="layout mx-auto flex h-20 items-center justify-between px-4">
        {/* Skip to content link - visible on focus */}
        <a 
          href="#main-content" 
          className="absolute left-0 top-0 -translate-y-full bg-accent-gold px-4 py-3 text-primary-navy transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2"
        >
          Skip to content
        </a>
        
        {/* Logo placeholder or empty div if needed for spacing, otherwise remove entirely */}
        <div className="w-[150px]"></div> {/* Placeholder for width that logo occupied, adjust or remove as needed for layout */}

        {/* Desktop Navigation */}
        <DesktopNavigation 
          navLinks={finalNavLinks}
          showCta={headerSettings.showCta}
          ctaText={headerSettings.ctaText}
          ctaLink={headerSettings.ctaLink}
          ctaBackgroundColor={headerSettings.ctaBackgroundColor}
          ctaTextColor={headerSettings.ctaTextColor}
        />

        {/* Mobile Navigation Toggle */}
        <button 
          ref={toggleButtonRef}
          className="lg:hidden p-2 focus:outline-none focus:ring-2 focus:ring-accent-gold rounded-md"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          {isOpen ? (
            <FaTimes className="h-6 w-6 text-text-light" />
          ) : (
            <FaBars className="h-6 w-6 text-text-light" />
          )}
        </button>

        {/* Mobile Navigation Menu */}
        <MobileNavigation 
          isOpen={isOpen} 
          onClose={toggleMenu} 
          navLinks={finalNavLinks}
          showCta={headerSettings.showCta}
          ctaText={headerSettings.ctaText}
          ctaLink={headerSettings.ctaLink}      
        />
      </div>
    </header>
  );
};

export default Header; 