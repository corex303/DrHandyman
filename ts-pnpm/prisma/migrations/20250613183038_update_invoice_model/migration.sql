/*
  Warnings:

  - You are about to drop the column `amountPaid` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `issueDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `relatedServiceRequestId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Invoice_customerId_idx";

-- DropIndex
DROP INDEX "Invoice_invoiceNumber_key";

-- DropIndex
DROP INDEX "Invoice_status_idx";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amountPaid",
DROP COLUMN "invoiceNumber",
DROP COLUMN "issueDate",
DROP COLUMN "notes",
DROP COLUMN "relatedServiceRequestId",
DROP COLUMN "totalAmount";
