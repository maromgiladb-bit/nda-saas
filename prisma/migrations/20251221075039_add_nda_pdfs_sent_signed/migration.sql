/*
  Warnings:

  - You are about to drop the column `billing_customer_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `billing_subscription_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `canceled_at` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `max_active_drafts` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `max_users` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `trial_ends_at` on the `organizations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "pdf_kind" AS ENUM ('SENT', 'SIGNED');

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "billing_customer_id",
DROP COLUMN "billing_subscription_id",
DROP COLUMN "canceled_at",
DROP COLUMN "max_active_drafts",
DROP COLUMN "max_users",
DROP COLUMN "trial_ends_at";

-- CreateTable
CREATE TABLE "nda_pdfs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "sign_request_id" UUID NOT NULL,
    "kind" "pdf_kind" NOT NULL,
    "s3_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nda_pdfs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nda_pdfs_organization_id_idx" ON "nda_pdfs"("organization_id");

-- CreateIndex
CREATE INDEX "nda_pdfs_sign_request_id_idx" ON "nda_pdfs"("sign_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "nda_pdfs_sign_request_id_kind_key" ON "nda_pdfs"("sign_request_id", "kind");

-- AddForeignKey
ALTER TABLE "nda_pdfs" ADD CONSTRAINT "nda_pdfs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nda_pdfs" ADD CONSTRAINT "nda_pdfs_sign_request_id_fkey" FOREIGN KEY ("sign_request_id") REFERENCES "sign_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
