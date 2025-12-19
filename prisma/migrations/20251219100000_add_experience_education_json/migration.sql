-- Add experience and education JSON fields to CvProfile
ALTER TABLE "CvProfile" ADD COLUMN "experienceJson" TEXT;
ALTER TABLE "CvProfile" ADD COLUMN "educationJson" TEXT;
