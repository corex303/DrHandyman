'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';

import NextImage from '@/components/NextImage';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import { AppearanceSettings, defaultAppearanceSettings } from '@/types/appearance';

interface HeaderProps {
  appearanceSettings?: AppearanceSettings;
}

const Header = ({ appearanceSettings: propsAppearanceSettings }: HeaderProps) => {
  const appearanceSettings = { ...defaultAppearanceSettings, ...propsAppearanceSettings };
  const headerSettings = { ...defaultAppearanceSettings.header, ...appearanceSettings.header };
  const logoUrl = appearanceSettings.logoUrl || '/images/drhandyman_home_screen.jpg';
  const headerBackgroundColor = headerSettings.backgroundColor || '#FFFFFF';

  const [isOpen, setIsOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full shadow-md"
      style={{
        backgroundColor: headerBackgroundColor,
        color: headerSettings.textColor
      }}
    >
      <div className="layout mx-auto flex h-20 items-center justify-between px-4">
        {/* Skip to content link - visible on focus */}
        <a 
          href="#main-content" 
          className="absolute left-0 top-0 -translate-y-full bg-primary-500 px-4 py-3 text-white transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Skip to content
        </a>
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="-ml-1 -mt-1">
            <NextImage
              src={logoUrl}
              width={40}
              height={40}
              alt="Dr. Handyman Logo"
              className="h-10 w-10 rounded-full object-cover"
            />
          </div>
          <span className="text-xl font-bold text-primary-500">Dr. Handyman</span>
        </Link>

        {/* Desktop Navigation */}
        <DesktopNavigation 
          navLinks={headerSettings.navLinks}
          showCta={headerSettings.showCta}
          ctaText={headerSettings.ctaText}
          ctaLink={headerSettings.ctaLink}
          ctaBackgroundColor={headerSettings.ctaBackgroundColor}
          ctaTextColor={headerSettings.ctaTextColor}
        />

        {/* Mobile Navigation Toggle */}
        <button 
          ref={toggleButtonRef}
          className="lg:hidden p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md" 
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          {isOpen ? (
            <FaTimes className="h-6 w-6 text-primary-500" />
          ) : (
            <FaBars className="h-6 w-6 text-primary-500" />
          )}
        </button>

        {/* Mobile Navigation Menu */}
        <MobileNavigation 
          isOpen={isOpen} 
          onClose={toggleMenu} 
          navLinks={headerSettings.navLinks} 
          showCta={headerSettings.showCta}
          ctaText={headerSettings.ctaText}
          ctaLink={headerSettings.ctaLink}      
        />
      </div>
    </header>
  );
};

export default Header; 