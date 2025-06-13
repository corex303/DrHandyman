/*
  Warnings:

  - A unique constraint covering the columns `[serviceFusionId]` on the table `MaintenanceWorker` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[maintenanceWorkerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MaintenanceWorker" ADD COLUMN     "serviceFusionId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "maintenanceWorkerId" TEXT;

-- CreateTable
CREATE TABLE "EmailVerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "EmailVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationRequest_token_key" ON "EmailVerificationRequest"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationRequest_userId_idx" ON "EmailVerificationRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorker_serviceFusionId_key" ON "MaintenanceWorker"("serviceFusionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_maintenanceWorkerId_key" ON "User"("maintenanceWorkerId");

-- AddForeignKey
ALTER TABLE "EmailVerificationRequest" ADD CONSTRAINT "EmailVerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
