import { PrismaClient, UserRole } from '../generated/prisma-client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Seed Services
  const servicesToSeed = [
    // Combined and updated list based on icons and previous seed data
    {
      name: "Roofing", 
      description: "Comprehensive roofing services, repairs, and replacements to protect your home.", 
      slug: "roofing", 
      imageUrl: "/images/services/placeholder-roofing.jpg" 
    },
    {
      name: "Plumbing", 
      description: "Full-service plumbing for leaks, installations, and emergencies, including repairs.", 
      slug: "plumbing", 
      imageUrl: "/images/services/placeholder-plumbing.jpg"
    },
    {
      name: "Painting", 
      description: "Professional interior and exterior painting services for a fresh, new look.", 
      slug: "painting", 
      imageUrl: "/images/services/placeholder-painting.jpg"
    },
    {
      name: "HVAC", 
      description: "Heating, ventilation, and air conditioning services, repairs, and installations.", 
      slug: "hvac", 
      imageUrl: "/images/services/placeholder-hvac.jpg"
    },
    {
      name: "Flooring", 
      description: "Expert flooring installation for various types including hardwood, tile, and laminate.", 
      slug: "flooring", 
      imageUrl: "/images/services/placeholder-flooring.jpg"
    },
    {
      name: "Exterior Work", 
      description: "Siding, gutters, pressure washing, and other exterior home maintenance and improvements.", 
      slug: "exterior-work", 
      imageUrl: "/images/services/placeholder-exterior.jpg"
    },
    {
      name: "Electrical", 
      description: "Safe and reliable electrical repairs, installations, and upgrades for your home.", 
      slug: "electrical", 
      imageUrl: "/images/services/placeholder-electrical.jpg"
    },
    {
      name: "General Repairs", // Renamed for clarity based on icon
      description: "Versatile handyman services for all your home repair and maintenance tasks, big or small.", 
      slug: "general-repairs", // Matched to new name
      imageUrl: "/images/services/placeholder-general-repairs.jpg"
    },
    {
      name: "Carpentry", 
      description: "Expert carpentry services for repairs, installations, and custom woodworking projects.", 
      slug: "carpentry", 
      imageUrl: "/images/services/placeholder-carpentry.jpg"
    },
    {
      name: "Concrete Repair", 
      description: "Professional concrete repair for driveways, patios, foundations, and walkways.", 
      slug: "concrete-repair", 
      imageUrl: "/images/services/placeholder-concrete.jpg"
    },
    {
      name: "Deck Building / Repair", 
      description: "Custom deck building, repair, and refinishing services to enhance your outdoor living space.", 
      slug: "deck-building-repair", 
      imageUrl: "/images/services/placeholder-deck.jpg"
    }
    // Removed original individual entries like "Flooring Installation" if covered by consolidated "Flooring"
    // Removed "Interior / Exterior Painting" if covered by consolidated "Painting"
    // Removed "Plumbing Repairs" if covered by consolidated "Plumbing"
    // Removed "General Handyman Services" if covered by "General Repairs"
  ];

  for (const serviceData of servicesToSeed) {
    const service = await prisma.service.upsert({
      where: { slug: serviceData.slug },
      update: {},
      create: serviceData,
    });
    console.log(`Created/updated service with id: ${service.id} (${service.name})`);
  }

  // Seed Admin User
  const adminPassword = await bcrypt.hash('adminpassword123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { 
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created/updated admin user: ${adminUser.email}`);

  // Seed Maintenance User
  const maintenancePassword = await bcrypt.hash('maintpassword123', 10);
  const maintenanceUser = await prisma.user.upsert({
    where: { email: 'maintenance@example.com' },
    update: {
      name: 'Maintenance User',
      role: UserRole.MAINTENANCE,
    },
    create: {
      email: 'maintenance@example.com',
      name: 'Maintenance User',
      role: UserRole.MAINTENANCE,
    },
  });
  console.log(`Created/updated maintenance user: ${maintenanceUser.email}`);

  // Seed Maintenance Workers
  const workersToSeed = [
    { name: "Derek", isActive: true },
    { name: "Juan", isActive: true },
    { name: "Rigo", isActive: true },
    { name: "Marcos", isActive: true },
    { name: "Demetrius", isActive: true },
    { name: "Matthew", isActive: true },
  ];

  for (const workerData of workersToSeed) {
    const worker = await prisma.maintenanceWorker.upsert({
      where: { name: workerData.name },
      update: { isActive: workerData.isActive },
      create: workerData,
    });
    console.log(`Created/updated maintenance worker: ${worker.name} (ID: ${worker.id}, Active: ${worker.isActive})`);
  }
  
  // Attempt to delete the old 'worker@example.com' user if it exists
  try {
    const oldWorker = await prisma.user.findUnique({ where: { email: 'worker@example.com' } });
    if (oldWorker) {
      await prisma.user.delete({ where: { email: 'worker@example.com' } });
      console.log(`Deleted old user: worker@example.com`);
    }
  } catch (error /*: any*/) { // Made error explicitly not any
    // Non-critical error, might fail if user doesn't exist or has relations preventing delete
    console.warn(`Could not delete old worker@example.com user: ${(error as Error).message}`);
  }

  // Seed Site Settings (single row)
  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: 'default_settings' }, // Use a predictable ID for a single-row table
    update: {
        siteName: 'Dr. Handyman NC',
        contactEmail: 'contact@drhandymannc.com',
        contactPhone: '555-123-4567',
        seoTitle: 'Dr. Handyman NC - Your Trusted Local Handyman',
        seoDescription: 'Professional handyman services in Your Area. Contact us for carpentry, plumbing, electrical, and more.'
    },
    create: {
        id: 'default_settings',
        siteName: 'Dr. Handyman NC',
        contactEmail: 'contact@drhandymannc.com',
        contactPhone: '555-123-4567',
        socialMedia: {
            facebook: 'https://facebook.com/drhandymannc',
            // Add other social media if available
        },
        seoTitle: 'Dr. Handyman NC - Your Trusted Local Handyman',
        seoDescription: 'Professional handyman services in Your Area. Contact us for carpentry, plumbing, electrical, and more.'
    }
  });
  console.log(`Created/updated site settings with id: ${siteSettings.id}`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 