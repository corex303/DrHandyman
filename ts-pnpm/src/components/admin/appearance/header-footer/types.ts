export interface HeaderSettings {
  layout?: string;
  navLinks?: Array<{ id: string; text: string; url: string; newTab?: boolean }>;
  cta?: { text?: string; url?: string; visible?: boolean };
  backgroundColor?: string;
  textColor?: string;
  sticky?: boolean;
}

export interface FooterSettings {
  layout?: string; // e.g., '1-column', '4-columns'
  copyrightText?: string;
  showSocialLinks?: boolean;
  footerLinks?: Array<{ id: string; text: string; url: string; newTab?: boolean }>;
  showContactInfo?: boolean;
  customHtml?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface AppearanceSettings {
  theme?: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  branding?: {
    logoUrl?: string;
    faviconUrl?: string;
  };
  header?: HeaderSettings;
  footer?: FooterSettings;
  homepageSections?: any[]; // Keep this generic for this file
} 