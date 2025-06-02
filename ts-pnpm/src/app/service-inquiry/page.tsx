"use client";

import React from 'react';
import ContactForm from '@/components/forms/ContactForm';
import PageHeader from '@/components/layout/PageHeader';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

export default function ServiceInquiryPage() {
  const recaptchaV3SiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY; 

  if (!recaptchaV3SiteKey) {
    console.error("Missing NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY environment variable.");
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <PageHeader
          title="Service Inquiry"
          description="Service inquiry form is temporarily unavailable due to a configuration issue."
        />
        <p className="text-red-500 mt-4">ReCAPTCHA is not configured. Please contact support.</p>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaV3SiteKey}> 
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Service Inquiry"
          description="Have a project in mind or need a repair? Fill out the form below, and we'll get back to you shortly. You can also upload photos of the issue."
        />
        <section className="mt-8">
          <div className="max-w-2xl mx-auto">
            <ContactForm />
          </div>
        </section>
      </div>
    </GoogleReCaptchaProvider>
  );
} 