import { PrismaClient, UserRole } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Seed Services
  const servicesToSeed = [
    { name: "Carpentry", description: "Expert carpentry services for repairs, installations, and custom work.", slug: "carpentry" },
    { name: "Concrete Repair", description: "Professional concrete repair for driveways, patios, and foundations.", slug: "concrete-repair" },
    { name: "Deck Building / Repair", description: "Custom deck building and repair services to enhance your outdoor space.", slug: "deck-building-repair" },
    { name: "Flooring Installation", description: "Installation of various flooring types including hardwood, laminate, and tile.", slug: "flooring-installation" },
    { name: "Interior / Exterior Painting", description: "High-quality interior and exterior painting services.", slug: "interior-exterior-painting" },
    { name: "Plumbing Repairs", description: "Reliable plumbing repair services for leaks, clogs, and installations.", slug: "plumbing-repairs" },
    { name: "Roofing", description: "Roofing repairs and installation services to protect your home.", slug: "roofing" },
    { name: "General Handyman Services", description: "Versatile handyman services for all your home repair and maintenance needs.", slug: "general-handyman-services" }
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
      password: adminPassword,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created/updated admin user: ${adminUser.email}`);

  // Seed Maintenance User (formerly Worker User)
  const maintenancePassword = await bcrypt.hash('maintpassword123', 10);
  const maintenanceUser = await prisma.user.upsert({
    where: { email: 'maintenance@example.com' },
    update: {
      name: 'Maintenance User',
      password: maintenancePassword,
      role: UserRole.MAINTENANCE,
    },
    create: {
      email: 'maintenance@example.com',
      name: 'Maintenance User',
      password: maintenancePassword,
      role: UserRole.MAINTENANCE,
    },
  });
  console.log(`Created/updated maintenance user: ${maintenanceUser.email}`);
  
  // Attempt to delete the old 'worker@example.com' user if it exists
  try {
    const oldWorker = await prisma.user.findUnique({ where: { email: 'worker@example.com' } });
    if (oldWorker) {
      await prisma.user.delete({ where: { email: 'worker@example.com' } });
      console.log(`Deleted old user: worker@example.com`);
    }
  } catch (error: any) {
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