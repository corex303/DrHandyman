import React from 'react';
import { HomepageSection } from './HeroConfig';
import HeroConfig from './HeroConfig';
import ServicesConfig from './ServicesConfig';
import CustomHtmlConfig from './CustomHtmlConfig';
import TestimonialsConfig from './TestimonialsConfig';
import PortfolioConfig from './PortfolioConfig';

interface SectionConfigProps {
    section: HomepageSection;
    onChange: (key: string, value: any) => void;
    disabled?: boolean;
}

const sectionConfigMap: Record<HomepageSection['type'], React.FC<SectionConfigProps>> = {
    hero: HeroConfig,
    services: ServicesConfig,
    customHtml: CustomHtmlConfig,
    testimonials: TestimonialsConfig,
    portfolio: PortfolioConfig,
};

const SectionConfigurator: React.FC<SectionConfigProps> = ({ section, onChange, disabled }) => {
    const ConfigComponent = sectionConfigMap[section.type];

    if (!ConfigComponent) {
        return <p>Unknown section type: {section.type}</p>;
    }

    return <ConfigComponent section={section} onChange={onChange} disabled={disabled} />;
};

export default SectionConfigurator; 