'use client';

import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";

import GeneralSettingsForm from './GeneralSettingsForm';
import ContactSettingsForm from './ContactSettingsForm';
import SocialMediaForm from './SocialMediaForm';
import SeoSettingsForm from './SeoSettingsForm';

export default function SiteSettingsPage() {
  return (
    <div className="flex flex-col w-full">
      <h1 className="text-2xl font-semibold mb-6">Site Settings & Configuration</h1>
      <p className="mb-8 text-gray-600">Manage global site settings, contact info, social media links, and SEO.</p>
      
      <Tabs aria-label="Site Settings Options" color="primary" variant="bordered">
        <Tab key="general" title="General">
          <Card>
            <CardBody>
              <GeneralSettingsForm />
            </CardBody>
          </Card>  
        </Tab>
        <Tab key="contact" title="Contact Info">
          <Card>
            <CardBody>
              <ContactSettingsForm />
            </CardBody>
          </Card>  
        </Tab>
        <Tab key="social" title="Social Media">
          <Card>
            <CardBody>
              <SocialMediaForm />
            </CardBody>
          </Card>  
        </Tab>
        <Tab key="seo" title="SEO">
          <Card>
            <CardBody>
              <SeoSettingsForm />
            </CardBody>
          </Card>  
        </Tab>
      </Tabs>
    </div>
  );
} 