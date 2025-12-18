-- AlterTable
ALTER TABLE "CvProfile" ADD COLUMN     "workPreference" TEXT DEFAULT 'ANY',
ADD COLUMN     "cvFileName" TEXT,
ADD COLUMN     "cvUploadedAt" TIMESTAMP(3);
