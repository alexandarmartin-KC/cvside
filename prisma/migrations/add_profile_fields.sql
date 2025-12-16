-- Add work preference and CV info fields to CvProfile
-- Run this manually in production database

ALTER TABLE "CvProfile" 
ADD COLUMN IF NOT EXISTS "workPreference" TEXT DEFAULT 'ANY',
ADD COLUMN IF NOT EXISTS "cvFileName" TEXT,
ADD COLUMN IF NOT EXISTS "cvUploadedAt" TIMESTAMP(3);

-- Optional: Update existing records to have default workPreference
UPDATE "CvProfile" 
SET "workPreference" = 'ANY' 
WHERE "workPreference" IS NULL;
