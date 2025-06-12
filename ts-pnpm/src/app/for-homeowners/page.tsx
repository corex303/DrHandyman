import * as React from 'react';

export default function ForHomeownersPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">For Homeowners</h1>
      <p className="mb-4">
        We understand that your home is your biggest investment. That's why we offer a wide range of services to help you maintain and improve your property. From small repairs to major renovations, our team of experienced professionals is here to help.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">Our Services for Homeowners</h2>
      <ul className="list-disc list-inside mb-4">
        <li>General handyman services</li>
        <li>Kitchen and bathroom remodeling</li>
        <li>Deck and patio construction</li>
        <li>Fence installation and repair</li>
        <li>Painting and drywall</li>
        <li>And much more!</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Why Choose Us?</h2>
      <p className="mb-4">
        We are a locally owned and operated business with a reputation for quality workmanship and excellent customer service. We are fully licensed and insured, and we stand behind our work with a 100% satisfaction guarantee.
      </p>

      <div className="mt-8">
        <a href="/service-inquiry" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Request a Free Quote
        </a>
      </div>
    </main>
  );
} 