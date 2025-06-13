/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `MaintenanceWorker` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `MaintenanceWorker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MaintenanceWorker" ADD COLUMN "email" TEXT;

-- Manually update existing rows with placeholder unique emails
UPDATE "MaintenanceWorker" SET "email" = 'worker1@example.com' WHERE "id" IN (SELECT "id" FROM "MaintenanceWorker" LIMIT 1 OFFSET 0);
UPDATE "MaintenanceWorker" SET "email" = 'worker2@example.com' WHERE "id" IN (SELECT "id" FROM "MaintenanceWorker" LIMIT 1 OFFSET 1);
UPDATE "MaintenanceWorker" SET "email" = 'worker3@example.com' WHERE "id" IN (SELECT "id" FROM "MaintenanceWorker" LIMIT 1 OFFSET 2);
UPDATE "MaintenanceWorker" SET "email" = 'worker4@example.com' WHERE "id" IN (SELECT "id" FROM "MaintenanceWorker" LIMIT 1 OFFSET 3);
UPDATE "MaintenanceWorker" SET "email" = 'worker5@example.com' WHERE "id" IN (SELECT "id" FROM "MaintenanceWorker" LIMIT 1 OFFSET 4);
UPDATE "MaintenanceWorker" SET "email" = 'worker6@example.com' WHERE "id" IN (SELECT "id" FROM "MaintenanceWorker" LIMIT 1 OFFSET 5);

-- Now, alter the column to be NOT NULL
ALTER TABLE "MaintenanceWorker" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorker_email_key" ON "MaintenanceWorker"("email");
