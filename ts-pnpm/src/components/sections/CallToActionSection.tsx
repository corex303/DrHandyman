import React from 'react';

import ButtonLink from '@/components/links/ButtonLink';
import NextImage from '@/components/NextImage';

import { CallToActionSectionSettings } from '@/types/appearance';

interface CallToActionSectionProps {
  settings?: CallToActionSectionSettings;
}

const defaultSectionSettings: CallToActionSectionSettings = {
  title: 'Get In Touch',
  text: 'We are here to help you with your next project.',
  textAlignment: 'center',
  buttonText: 'Contact Us',
  buttonLink: '/contact',
  buttonVariant: 'primary',
  showSecondButton: false,
  backgroundColor: '#F3F4F6', // gray-100
  textColor: '#1F2937', // gray-800
  paddingTop: 'py-12',
  paddingBottom: 'pb-12',
};

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ settings: propsSettings }) => {
  const settings = { ...defaultSectionSettings, ...propsSettings };

  const textAlignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };
  
  const sectionStyle: React.CSSProperties = {
    color: settings.textColor,
    position: 'relative', // For background image overlay
  };

  if (settings.backgroundColor) {
    sectionStyle.backgroundColor = settings.backgroundColor;
  }

  const overlayStyle: React.CSSProperties = {
    content: '',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Default overlay, can be made configurable
    zIndex: 1,
  };

  return (
    <section 
      className={`relative ${settings.paddingTop} ${settings.paddingBottom}`}
      style={sectionStyle}
    >
      {settings.backgroundImageUrl && (
        <>
          <NextImage
            useSkeleton
            src={settings.backgroundImageUrl}
            alt={settings.title || 'Call to action background'}
            className="absolute inset-0"
            classNames={{ image: "object-cover w-full h-full" }}
            fill
          />
          {/* Optional: Add a configurable overlay color and opacity in settings */}
          <div style={overlayStyle}></div> 
        </>
      )}
      <div className={`layout relative z-10 mx-auto flex flex-col px-4 ${textAlignClasses[settings.textAlignment || 'center']}`}>
        {settings.title && (
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: settings.textColor }}>
            {settings.title}
          </h2>
        )}
        {settings.text && (
          <p className="mx-auto mb-8 max-w-2xl text-lg" style={{ color: settings.textColor ? 'rgba(255,255,255,0.8)' : undefined }}>
            {/* Adjust opacity for light text on dark/image backgrounds */}
            {settings.text}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {settings.buttonText && settings.buttonLink && (
            <ButtonLink 
              href={settings.buttonLink} 
              variant={settings.buttonVariant || 'primary'} 
              className="text-lg"
            >
              {settings.buttonText}
            </ButtonLink>
          )}
          {settings.showSecondButton && settings.secondButtonText && settings.secondButtonLink && (
            <ButtonLink 
              href={settings.secondButtonLink} 
              variant={settings.secondButtonVariant || 'outline'} 
              className="text-lg"
            >
              {settings.secondButtonText}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}; 