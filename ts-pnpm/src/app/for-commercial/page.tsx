import * as React from 'react';

export default function ForCommercialPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">For Commercial & Corporate Clients</h1>
      <p className="mb-4">
        We provide professional, reliable handyman services for businesses of all sizes. From office buildings to retail spaces, we have the experience and expertise to handle all your maintenance and repair needs, with minimal disruption to your operations.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">Our Commercial Services</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Office maintenance and repairs</li>
        <li>Retail store maintenance</li>
        <li>Restaurant and hospitality maintenance</li>
        <li>Commercial property repairs</li>
        <li>Scheduled maintenance contracts</li>
        <li>And much more!</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Your Partner in Business</h2>
      <p className="mb-4">
        We understand the unique needs of commercial clients. We offer flexible scheduling, detailed invoicing, and a commitment to professionalism. Let us handle the maintenance so you can focus on your business.
      </p>

      <div className="mt-8">
        <a href="/service-inquiry" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Request a Commercial Consultation
        </a>
      </div>
    </main>
  );
} 