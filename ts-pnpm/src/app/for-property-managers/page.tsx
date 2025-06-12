import * as React from 'react';

export default function ForPropertyManagersPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">For Property & Community Managers</h1>
      <p className="mb-4">
        Managing multiple properties is a demanding job. We provide reliable, responsive, and professional handyman services to keep your properties in top condition, ensuring tenant satisfaction and protecting your investment.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">Our Services for Property Managers</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Scheduled maintenance programs</li>
        <li>Tenant turnover repairs and cleaning</li>
        <li>Common area maintenance</li>
        <li>Emergency repair services</li>
        <li>Vendor coordination</li>
        <li>And much more!</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Partner with Us</h2>
      <p className="mb-4">
        We offer customized service agreements to meet the unique needs of your properties. Our team is professional, reliable, and dedicated to providing the highest level of service. We are your trusted partner in property maintenance.
      </p>

      <div className="mt-8">
        <a href="/service-inquiry" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Request a Maintenance Plan
        </a>
      </div>
    </main>
  );
} 