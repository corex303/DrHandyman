-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PhotoSet" (
    "id" TEXT NOT NULL,
    "beforeImageUrl" TEXT NOT NULL,
    "afterImageUrl" TEXT NOT NULL,
    "description" TEXT,
    "serviceCategory" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoSet_uploadedById_idx" ON "PhotoSet"("uploadedById");

-- CreateIndex
CREATE INDEX "PhotoSet_serviceCategory_idx" ON "PhotoSet"("serviceCategory");

-- CreateIndex
CREATE INDEX "PhotoSet_approvalStatus_idx" ON "PhotoSet"("approvalStatus");

-- AddForeignKey
ALTER TABLE "PhotoSet" ADD CONSTRAINT "PhotoSet_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSet" ADD CONSTRAINT "PhotoSet_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
