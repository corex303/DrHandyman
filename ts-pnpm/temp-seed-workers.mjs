import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workerNames = ["Derek", "Rigo", "Marcos", "Juan", "Matthew"];
  console.log("Starting to seed maintenance workers...");

  for (const name of workerNames) {
    try {
      const existingWorker = await prisma.maintenanceWorker.findFirst({
        where: { name: name },
      });

      if (existingWorker) {
        console.log(`Worker "${name}" already exists. Skipping.`);
      } else {
        await prisma.maintenanceWorker.create({
          data: {
            name: name,
            isActive: true,
          },
        });
        console.log(`Created worker: ${name}`);
      }
    } catch (error) {
      console.error(`Error processing worker "${name}":`, error);
    }
  }
  console.log("Finished seeding maintenance workers.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 