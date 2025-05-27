/*
  Warnings:

  - You are about to drop the column `createdAt` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedById` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoSet" DROP CONSTRAINT "PhotoSet_reviewedById_fkey";

-- DropForeignKey
ALTER TABLE "PhotoSet" DROP CONSTRAINT "PhotoSet_uploadedById_fkey";

-- DropIndex
DROP INDEX "PhotoSet_approvalStatus_idx";

-- DropIndex
DROP INDEX "PhotoSet_serviceCategory_idx";

-- DropIndex
DROP INDEX "PhotoSet_uploadedById_idx";

-- AlterTable
ALTER TABLE "PhotoSet" DROP COLUMN "createdAt",
DROP COLUMN "rejectionReason",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedById",
DROP COLUMN "updatedAt",
DROP COLUMN "uploadedById",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "maintenanceWorkerId" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "managedById" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MaintenanceWorker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorker_name_key" ON "MaintenanceWorker"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "PhotoSet_maintenanceWorkerId_idx" ON "PhotoSet"("maintenanceWorkerId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSet" ADD CONSTRAINT "PhotoSet_maintenanceWorkerId_fkey" FOREIGN KEY ("maintenanceWorkerId") REFERENCES "MaintenanceWorker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSet" ADD CONSTRAINT "PhotoSet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
