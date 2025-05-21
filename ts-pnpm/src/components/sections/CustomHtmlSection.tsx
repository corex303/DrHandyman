import React from 'react';
import { CustomHtmlSectionSettings } from '@/types/appearance';
import { cn } from '@/lib/utils';

interface CustomHtmlSectionProps {
  settings?: CustomHtmlSectionSettings;
}

const defaultSectionSettings: CustomHtmlSectionSettings = {
  htmlContent: '<p><em>No custom HTML content provided.</em></p>',
  backgroundColor: 'transparent',
  paddingTop: 'py-0',
  paddingBottom: 'pb-0',
  maxWidth: 'none',
  fullWidthContainer: false,
};

export const CustomHtmlSection: React.FC<CustomHtmlSectionProps> = ({ settings: propsSettings }) => {
  const settings = { ...defaultSectionSettings, ...propsSettings };

  const containerMaxWidthClasses: Record<string, string> = {
    none: 'max-w-none',
    'container.sm': 'max-w-screen-sm',
    'container.md': 'max-w-screen-md',
    'container.lg': 'max-w-screen-lg',
    'container.xl': 'max-w-screen-xl',
  };

  const sectionClasses = cn(
    settings.fullWidthContainer ? 'w-full' : 'layout mx-auto px-4',
    settings.fullWidthContainer ? settings.paddingTop : '',
    settings.fullWidthContainer ? settings.paddingBottom : '',
  );
  
  const innerDivClasses = cn(
    settings.fullWidthContainer ? containerMaxWidthClasses[settings.maxWidth || 'none'] : '',
    settings.fullWidthContainer && settings.maxWidth !== 'none' ? 'mx-auto px-4' : '', 
  );

  const sectionStyle: React.CSSProperties = {
    backgroundColor: settings.backgroundColor,
  };
  
  const outerSectionClasses = cn(
    !settings.fullWidthContainer ? settings.paddingTop : '',
    !settings.fullWidthContainer ? settings.paddingBottom : '',
  );

  return (
    <section 
      className={outerSectionClasses}
      style={sectionStyle}
    >
      <div className={sectionClasses}>
        <div 
          className={innerDivClasses}
          dangerouslySetInnerHTML={{ __html: settings.htmlContent || '' }} 
        />
      </div>
    </section>
  );
}; 