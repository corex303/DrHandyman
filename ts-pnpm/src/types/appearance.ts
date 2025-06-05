export interface AppearanceSettings {
  theme?: 'light' | 'dark' | 'system';
  logoUrl?: string;
  faviconUrl?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
    base?: string;
    text?: string;
    textSecondary?: string;
    heading?: string;
  };
  fonts?: {
    global?: string;
    heading?: string;
  };
  header?: {
    layout?: 'standard' | 'centered' | 'minimal';
    backgroundColor?: string;
    textColor?: string;
    showCta?: boolean;
    ctaText?: string;
    ctaLink?: string;
    ctaBackgroundColor?: string;
    ctaTextColor?: string;
    navLinks?: Array<{ 
      id: string; 
      text: string; 
      href: string; 
      iconSrc?: string; // Added for top-level links if needed in future
      subLinks?: Array<{ 
        id: string; 
        text: string; 
        href: string; 
        iconSrc?: string; // <<<< Added iconSrc here for subLinks
      }> 
    }>;
  };
  footer?: {
    layout?: 'standard' | 'compact' | 'minimal';
    backgroundColor?: string;
    textColor?: string;
    showSocialIcons?: boolean;
    showContactInfo?: boolean;
    customHtml?: string;
    copyrightText?: string;
    linkColumns?: Array<{
      id: string;
      title: string;
      links: Array<{ id: string; text: string; href: string }>;
    }>;
  };
  homepage?: {
    layout?: Array<{ id: string; type: string; settings?: Record<string, any> }>; // 'hero', 'services', 'testimonials', 'cta', 'gallery', 'faq'
    // Section specific settings can be detailed further if needed
    // e.g. hero: { title: string, subtitle: string, cta: { text: string, link: string }, image: string }
  };
}

// Specific settings interfaces for different section types (can be expanded)
export interface HeroSectionSettings {
  title?: string;
  subtitle?: string;
  textAlignment?: 'left' | 'center' | 'right';
  textColor?: string; // Hex color
  button1Text?: string;
  button1Link?: string;
  button1Variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'dark';
  button2Text?: string;
  button2Link?: string;
  button2Variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'dark';
  backgroundImageUrl?: string;
  backgroundOverlayColor?: string; // e.g., 'rgba(0, 0, 0, 0.5)'
  backgroundOverlayOpacity?: number; // 0 to 1
  showOverlay?: boolean;
  minHeight?: string; // e.g., '500px', '75vh'
  paddingTop?: string; // e.g., 'py-12', 'pt-20'
  paddingBottom?: string; // e.g., 'pb-20'
}

export interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorRole?: string;
  authorCompany?: string;
  avatarUrl?: string;
}

export interface TestimonialsSectionSettings {
  title?: string;
  subtitle?: string;
  textAlignment?: 'left' | 'center' | 'right';
  layoutStyle?: 'grid' | 'carousel'; // For future carousel implementation
  columns?: 2 | 3; // For grid layout
  testimonials: TestimonialItem[];
  backgroundColor?: string;
  textColor?: string; // For title/subtitle
  itemBackgroundColor?: string;
  itemTextColor?: string; // For testimonial text
  authorTextColor?: string; // For author name/role
  paddingTop?: string;
  paddingBottom?: string;
}

export interface CallToActionSectionSettings {
  title?: string;
  text?: string; // Subtitle or descriptive text
  textAlignment?: 'left' | 'center' | 'right';
  buttonText?: string;
  buttonLink?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'dark';
  showSecondButton?: boolean;
  secondButtonText?: string;
  secondButtonLink?: string;
  secondButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'dark';
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  category?: string;
  description?: string;
  link?: string;
}

export interface PortfolioSectionSettings {
  title?: string;
  subtitle?: string;
  textAlignment?: 'left' | 'center' | 'right';
  columns?: 2 | 3 | 4; // For grid layout
  items: PortfolioItem[];
  showViewAllButton?: boolean;
  viewAllButtonText?: string;
  viewAllButtonLink?: string;
  viewAllButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'dark';
  itemStyle?: 'card' | 'overlay'; // How items are displayed
  imageAspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  backgroundColor?: string;
  textColor?: string; // For title/subtitle
  itemTitleColor?: string;
  itemTextColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
}

// New Gallery Section Interfaces
export interface GalleryItem {
  id: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
}

export interface GallerySectionSettings {
  title?: string;
  subtitle?: string;
  textAlignment?: 'left' | 'center' | 'right';
  items: GalleryItem[];
  layoutStyle?: 'grid' | 'masonry' | 'carousel'; // Start with grid
  columns?: 2 | 3 | 4 | 5 | 6; // More options for gallery
  imageAspectRatio?: 'auto' | '1/1' | '4/3' | '3/4' | '16/9' | '9/16';
  lightboxEnabled?: boolean; // For future enhancement
  backgroundColor?: string;
  textColor?: string; // For title/subtitle
  paddingTop?: string;
  paddingBottom?: string;
}

// New FAQ Section Interfaces
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSectionSettings {
  title?: string;
  subtitle?: string;
  textAlignment?: 'left' | 'center' | 'right';
  items: FaqItem[];
  layoutStyle?: 'accordion' | 'list'; // Accordion is common for FAQs
  openMultiple?: boolean; // For accordion: allow multiple items open
  iconOpen?: string; // Icon for open state (e.g., 'FaMinus') - for future icon components
  iconClosed?: string; // Icon for closed state (e.g., 'FaPlus')
  backgroundColor?: string;
  textColor?: string; // For title/subtitle
  questionTextColor?: string;
  answerTextColor?: string;
  borderColor?: string; // For separators or item borders
  paddingTop?: string;
  paddingBottom?: string;
}

// New Custom HTML Section Interface
export interface CustomHtmlSectionSettings {
  htmlContent?: string;
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  maxWidth?: string; // e.g., 'none', 'container.sm', 'container.md', 'container.lg', 'container.xl'
  fullWidthContainer?: boolean; // If true, padding is applied inside the container, not outside
}

// New Service Section Interfaces
export interface ServiceItem {
  id: string;
  icon?: string; 
  title: string;
  description: string;
  link?: string;
}

export interface ServicesSectionSettings {
  title?: string;
  subtitle?: string;
  textAlignment?: 'left' | 'center' | 'right';
  items?: ServiceItem[];
  layoutStyle?: 'grid' | 'list' | 'feature-list';
  columns?: 2 | 3 | 4;
  backgroundColor?: string;
  textColor?: string;
  itemTitleColor?: string;
  itemTextColor?: string;
  itemBackgroundColor?: string;
  iconColor?: string;
  viewAllServicesText?: string;
  viewAllServicesLink?: string;
  paddingTop?: string;
  paddingBottom?: string;
}

// Default values can also be defined here if needed
export const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'light',
  colors: {
    primary: '#3B82F6', // blue-500
    secondary: '#10B981', // green-500
    accent: '#F59E0B', // amber-500
    neutral: '#4B5563', // gray-600
    base: '#F3F4F6', // gray-100
    text: '#1F2937', // gray-800
    textSecondary: '#6B7280', // gray-500
    heading: '#111827', // gray-900
  },
  fonts: {
    global: 'Inter, sans-serif',
    heading: 'Poppins, sans-serif',
  },
  header: {
    layout: 'standard',
    showCta: true,
    ctaText: 'Get a Quote',
    ctaLink: '/service-inquiry',
    navLinks: [
      { id: 'home', text: 'Home', href: '/' },
      { 
        id: 'services', 
        text: 'Services', 
        href: '/services', 
        subLinks: [
          { id: 'roofing', text: 'Roofing', href: '/services/roofing', iconSrc: '/images/icons/roofing.png' },
          { id: 'plumbing', text: 'Plumbing', href: '/services/plumbing', iconSrc: '/images/icons/plumb.png' },
          { id: 'painting', text: 'Painting', href: '/services/painting', iconSrc: '/images/icons/paint.png' },
          { id: 'hvac', text: 'HVAC', href: '/services/hvac', iconSrc: '/images/icons/hvac.png' },
          { id: 'flooring', text: 'Flooring', href: '/services/flooring', iconSrc: '/images/icons/flooring.png' },
          { id: 'exterior-work', text: 'Exterior Work', href: '/services/exterior-work', iconSrc: '/images/icons/exterior.png' },
          { id: 'electrical', text: 'Electrical', href: '/services/electrical', iconSrc: '/images/icons/electric.png' },
          { id: 'general-repair', text: 'General Repairs', href: '/services/general-repairs', iconSrc: '/images/icons/repair.png' }, // Matched slug from seed
        ]
      },
      { id: 'about', text: 'About', href: '/about' },
      { id: 'service-inquiry', text: 'Service Inquiry', href: '/service-inquiry' },
    ],
  },
  footer: {
    layout: 'standard',
    showSocialIcons: true,
    showContactInfo: true,
    copyrightText: `© ${new Date().getFullYear()} Dr. Handyman. All rights reserved.`,
    linkColumns: [
      {
        id: 'col-services',
        title: 'Our Services',
        links: [
          { id: 'serv-floor', text: 'Flooring', href: '/services/flooring' },
          { id: 'serv-plumb', text: 'Plumbing', href: '/services/plumbing' },
          { id: 'serv-elec', text: 'Electrical Work', href: '/services/electrical' },
          { id: 'serv-paint', text: 'Painting', href: '/services/painting' },
        ],
      },
      {
        id: 'col-company',
        title: 'Company',
        links: [
          { id: 'comp-about', text: 'About Us', href: '/about' },
          { id: 'comp-portfolio', text: 'Portfolio', href: '/portfolio' },
          { id: 'comp-blog', text: 'Blog', href: '/blog' },
          { id: 'comp-contact', text: 'Contact', href: '/contact' },
        ],
      },
      {
        id: 'col-legal',
        title: 'Legal',
        links: [
          { id: 'legal-privacy', text: 'Privacy Policy', href: '/privacy-policy' },
          { id: 'legal-terms', text: 'Terms of Service', href: '/terms-of-service' },
          { id: 'legal-cookies', text: 'Cookie Policy', href: '/cookie-policy' },
        ],
      },
    ],
  },
  homepage: {
    layout: [
      // Default Hero Section
      {
        id: 'hero-1', 
        type: 'hero',
        settings: {
          title: 'Welcome to Dr. Handyman!',
          subtitle: 'Your trusted partner for home repairs and improvements.',
          textAlignment: 'center',
          textColor: '#FFFFFF', // White text for dark backgrounds
          button1Text: 'Our Services',
          button1Link: '/services',
          button1Variant: 'light',
          button2Text: 'Get a Free Quote',
          button2Link: '/contact',
          button2Variant: 'outline', // Assuming outline is good on dark backgrounds
          backgroundImageUrl: '/images/hero-background-5.jpg', // Default placeholder
          showOverlay: true,
          backgroundOverlayColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent black
          minHeight: '70vh',
          paddingTop: 'py-20',
          paddingBottom: 'pb-20',
        } as HeroSectionSettings, // Cast to specific type
      }, 
      // Default Services Section (assuming a simple version for now)
      {
        id: 'services-1',
        type: 'services', // You'll need to define ServicesSectionSettings and component
        settings: {
          title: 'Our Services'
          // Add more settings as defined in ServicesSectionSettings
          // e.g., items: [{id: 's1', title: 'Plumbing', ...}, ...], layoutStyle: 'grid', columns: 3
        } // as ServicesSectionSettings - uncomment when interface exists
      },
      // Default Testimonials Section
      {
        id: 'testimonials-1',
        type: 'testimonials',
        settings: {
          title: 'What Our Clients Say',
          subtitle: "Honest feedback from homeowners we've helped.",
          textAlignment: 'center',
          layoutStyle: 'grid', // or 'carousel'
          columns: 2, // For grid layout
          testimonials: [
            {
              id: 't1',
              quote: 'Dr. Handyman was incredibly professional and fixed our plumbing issue in no time. Highly recommend!',
              authorName: 'Sarah L.',
              authorRole: 'Homeowner',
              avatarUrl: '/images/avatars/avatar-1.jpg', // Placeholder
            },
            {
              id: 't2',
              quote: "Their team renovated our kitchen, and the results are stunning. Great attention to detail.",
              authorName: 'Mark P.',
              authorRole: 'Homeowner',
              avatarUrl: '/images/avatars/avatar-2.jpg', // Placeholder
            },
            // Add more testimonials as needed
          ],
          backgroundColor: '#FFFFFF', // white
          textColor: '#1F2937', // gray-800
          itemBackgroundColor: '#F9FAFB', // gray-50
          itemTextColor: '#4B5563', // gray-600
          authorTextColor: '#1F2937', // gray-800
          paddingTop: 'py-16',
          paddingBottom: 'pb-16',
        } as TestimonialsSectionSettings,
      },
      // Default Call To Action Section
      {
        id: 'cta-1',
        type: 'cta',
        settings: {
          title: 'Ready to Start Your Next Project?',
          text: "Contact us today for a free consultation and estimate. We're here to help bring your vision to life.",
          textAlignment: 'center',
          buttonText: 'Get a Free Quote',
          buttonLink: '/contact',
          buttonVariant: 'primary',
          showSecondButton: true,
          secondButtonText: 'Our Services',
          secondButtonLink: '/services',
          secondButtonVariant: 'outline',
          backgroundColor: '#1F2937', // gray-800
          textColor: '#FFFFFF', // white
          paddingTop: 'py-16',
          paddingBottom: 'pb-16',
        } as CallToActionSectionSettings,
      },
      // Default Portfolio Section
      {
        id: 'portfolio-1',
        type: 'portfolio',
        settings: {
          title: 'Our Recent Work',
          subtitle: "Take a look at some of the projects we've successfully completed.",
          textAlignment: 'center',
          columns: 3,
          items: [
            {
              id: 'p1',
              imageUrl: '/images/portfolio/project-1.jpg', // Placeholder
              title: 'Kitchen Remodel',
              category: 'Renovation',
              description: 'Complete overhaul of a modern kitchen space.',
              link: '/portfolio/kitchen-remodel',
            },
            {
              id: 'p2',
              imageUrl: '/images/portfolio/project-2.jpg', // Placeholder
              title: 'Bathroom Upgrade',
              category: 'Renovation',
              description: 'Luxury bathroom with custom tiling and fixtures.',
              link: '/portfolio/bathroom-upgrade',
            },
            {
              id: 'p3',
              imageUrl: '/images/portfolio/project-3.jpg', // Placeholder
              title: 'Deck Construction',
              category: 'Exterior',
              description: 'Spacious new deck for outdoor living.',
              link: '/portfolio/deck-construction',
            },
          ],
          showViewAllButton: true,
          viewAllButtonText: 'View Full Portfolio',
          viewAllButtonLink: '/portfolio',
          viewAllButtonVariant: 'primary',
          itemStyle: 'card',
          imageAspectRatio: '16/9',
          backgroundColor: '#F9FAFB', // gray-50
          textColor: '#1F2937', // gray-800
          itemTitleColor: '#111827', // gray-900
          itemTextColor: '#4B5563', // gray-600
          paddingTop: 'py-16',
          paddingBottom: 'pb-16',
        } as PortfolioSectionSettings, // <<< COMMA ADDED HERE
      },
      // Default Gallery Section
      {
        id: 'gallery-1',
        type: 'gallery',
        settings: {
          title: 'Our Gallery',
          subtitle: 'A collection of our finest work and moments.',
          textAlignment: 'center',
          items: [
            { id: 'gal1', imageUrl: '/images/gallery/gallery-placeholder-1.jpg', altText: 'Gallery image 1', caption: 'Beautiful Scenery' },
            { id: 'gal2', imageUrl: '/images/gallery/gallery-placeholder-2.jpg', altText: 'Gallery image 2', caption: 'Modern Architecture' },
            { id: 'gal3', imageUrl: '/images/gallery/gallery-placeholder-3.jpg', altText: 'Gallery image 3', caption: 'Abstract Design' },
            { id: 'gal4', imageUrl: '/images/gallery/gallery-placeholder-4.jpg', altText: 'Gallery image 4', caption: 'Natures Beauty' },
            { id: 'gal5', imageUrl: '/images/gallery/gallery-placeholder-5.jpg', altText: 'Gallery image 5', caption: 'Urban Exploration' },
            { id: 'gal6', imageUrl: '/images/gallery/gallery-placeholder-6.jpg', altText: 'Gallery image 6', caption: 'Minimalist Setup' },
          ],
          layoutStyle: 'grid',
          columns: 3,
          imageAspectRatio: '1/1', // Square images for a common gallery look
          lightboxEnabled: false, // Default to false, can be enabled
          backgroundColor: '#FFFFFF', // white
          textColor: '#1F2937', // gray-800
          paddingTop: 'py-16',
          paddingBottom: 'pb-16',
        } as GallerySectionSettings, // <<< COMMA ADDED HERE
      },
      // Default FAQ Section
      {
        id: 'faq-1',
        type: 'faq',
        settings: {
          title: 'Frequently Asked Questions',
          subtitle: 'Find answers to common questions about our services.',
          textAlignment: 'center',
          items: [
            { id: 'faq1', question: 'What services do you offer?', answer: 'We offer a wide range of handyman services including plumbing, electrical, carpentry, painting, and general home repairs.' },
            { id: 'faq2', question: 'What are your service hours?', answer: 'Our standard service hours are Monday to Friday, 9 AM to 5 PM. Emergency services are available 24/7.' },
            { id: 'faq3', question: 'How do I schedule a service?', answer: 'You can schedule a service by calling us directly, sending an email, or filling out the contact form on our website.' },
            { id: 'faq4', question: 'Do you provide free estimates?', answer: 'Yes, we provide free, no-obligation estimates for all our services. Contact us to discuss your project.' },
          ],
          layoutStyle: 'accordion',
          openMultiple: false, // Only one FAQ item open at a time
          // iconOpen and iconClosed can be set if you use an icon library
          backgroundColor: '#F9FAFB', // gray-50
          textColor: '#1F2937', // gray-800
          questionTextColor: '#111827', // gray-900
          answerTextColor: '#374151', // gray-700
          borderColor: '#E5E7EB', // gray-200
          paddingTop: 'py-16',
          paddingBottom: 'pb-16',
        } as FaqSectionSettings, // <<< COMMA ADDED HERE
      },
      // Default Custom HTML Section
      {
        id: 'custom-html-1',
        type: 'customHtml',
        settings: {
          htmlContent: '<div style="padding: 2rem; text-align: center; border: 2px dashed #ccc;"><h2>Custom HTML Section Placeholder</h2><p>Edit this content in the admin panel.</p></div>',
          backgroundColor: '#FFFFFF',
          paddingTop: 'py-8',
          paddingBottom: 'pb-8',
          maxWidth: 'container.md',
          fullWidthContainer: false,
        } as CustomHtmlSectionSettings,
      },
      // Add other default sections here
    ],
  },
}; 