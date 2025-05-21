'use client'; // If it needs to access browser APIs or hooks, otherwise remove

import { Service } from '@prisma/client'; // Add this import

// Assuming manual Service type is defined elsewhere or passed in
// For this component, we only need a subset of service properties.
interface ServiceSchemaProps {
  service: Service; // Use the imported Service type
  siteName: string; // e.g., "Dr. Handyman NC"
  siteUrl: string;  // e.g., "https://www.drhandymannc.com"
}

const ServiceSchemaMarkup: React.FC<ServiceSchemaProps> = ({ service, siteName, siteUrl }) => {
  const serviceUrl = `${siteUrl}/services/${service.slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description.substring(0, 250), // Keep it concise
    url: serviceUrl,
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      // Potentially add logo here if available globally or via props
    },
    // If you have service categories, you can add them here
    // serviceType: "Category Name",
    ...(service.imageUrl && { image: service.imageUrl }),
    // If you have specific offers (like price ranges or fixed prices for services)
    // offers: {
    //   '@type': 'Offer',
    //   priceCurrency: 'USD',
    //   price: 'Contact for price' // Or a specific price
    // },
    // Area served can be useful too
    // areaServed: {
    //   '@type': 'AdministrativeArea',
    //   name: 'Raleigh, NC' // Or make this dynamic
    // }
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: serviceUrl,
    name: `${service.name} - Service Details`,
    description: service.description.substring(0, 160),
    isPartOf: {
      '@type': 'WebSite',
      url: siteUrl,
      name: siteName,
    },
    // mainEntity: schema, // Link it to the Service schema
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
    </>
  );
};

export default ServiceSchemaMarkup; 