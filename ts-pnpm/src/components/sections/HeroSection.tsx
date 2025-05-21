import React from 'react';
import NextImage from '@/components/NextImage';
import ButtonLink from '@/components/links/ButtonLink';
import { HeroSectionSettings } from '@/types/appearance'; // Import the specific type

interface HeroSectionProps {
  settings?: HeroSectionSettings; // Use the specific type for settings
}

// Default settings for Hero Section if none are provided or a field is missing
const defaultHeroSettings: HeroSectionSettings = {
  title: 'Headline Goes Here',
  subtitle: 'Supporting text or a brief description of the value proposition.',
  textAlignment: 'center',
  textColor: '#FFFFFF',
  button1Text: 'Primary Action',
  button1Link: '#',
  button1Variant: 'light',
  backgroundImageUrl: '/images/placeholder-hero.jpg', // A generic placeholder
  showOverlay: true,
  backgroundOverlayColor: 'rgba(0, 0, 0, 0.4)',
  minHeight: '60vh',
  paddingTop: 'py-16',
  paddingBottom: 'pb-16',
};

export const HeroSection: React.FC<HeroSectionProps> = ({ settings: propsSettings }) => {
  // Merge provided settings with defaults
  const settings = { ...defaultHeroSettings, ...propsSettings };

  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  const sectionStyle: React.CSSProperties = {
    minHeight: settings.minHeight,
    position: 'relative',
    color: settings.textColor,
    // paddingTop and paddingBottom will be handled by Tailwind classes for responsiveness
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: settings.backgroundOverlayColor,
    zIndex: 1,
  };

  return (
    <section 
      className={`relative flex ${settings.paddingTop} ${settings.paddingBottom}`}
      style={sectionStyle}
    >
      {settings.backgroundImageUrl && (
        <NextImage
          useSkeleton
          src={settings.backgroundImageUrl}
          alt={settings.title || 'Hero background'}
          className="absolute inset-0"
          classNames={{ image: "object-cover w-full h-full" }}
          fill
          priority // Good for LCP
        />
      )}
      {settings.showOverlay && <div style={overlayStyle}></div>}

      <div className={`layout relative z-10 mx-auto flex flex-col ${alignmentClasses[settings.textAlignment || 'center']}`}> 
        {settings.title && (
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl" style={{ color: settings.textColor }}>
            {settings.title}
          </h1>
        )}
        {settings.subtitle && (
          <p className="mb-8 max-w-xl md:text-lg" style={{ color: settings.textColor ? 'rgba(255,255,255,0.9)' : undefined }}>
            {/* Apply slight opacity if text color is pure white for better readability on varied backgrounds */}
            {/* Or, allow subtitleColor in settings for more control */}
            {settings.subtitle}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {settings.button1Text && settings.button1Link && (
            <ButtonLink 
              href={settings.button1Link} 
              variant={settings.button1Variant || 'light'} 
              className="text-lg"
            >
              {settings.button1Text}
            </ButtonLink>
          )}
          {settings.button2Text && settings.button2Link && (
            <ButtonLink 
              href={settings.button2Link} 
              variant={settings.button2Variant || 'outline'}
              className="text-lg"
            >
              {settings.button2Text}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}; 