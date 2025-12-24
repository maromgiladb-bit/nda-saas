-- CreateEnum
CREATE TYPE "nda_workflow_state" AS ENUM ('FILLING', 'AWAITING_INPUT', 'REVIEWING_CHANGES', 'READY_TO_SIGN', 'AWAITING_SIGNATURE', 'SIGNING_COMPLETE');

-- AlterTable
ALTER TABLE "nda_drafts" ADD COLUMN     "pending_input_fields" JSONB,
ADD COLUMN     "recipient_email" TEXT,
ADD COLUMN     "workflow_state" "nda_workflow_state" NOT NULL DEFAULT 'FILLING';
