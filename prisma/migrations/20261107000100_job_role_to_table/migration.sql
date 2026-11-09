-- ===============================================
-- Migration: Convert JobRole enum to table
-- Date: 2024-11-07
-- SAFE: No data deletion, backward compatible
-- ===============================================

-- Step 1: Create new JobRole table
CREATE TABLE "job_roles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique index on key
CREATE UNIQUE INDEX "job_roles_key_key" ON "job_roles"("key");

-- Step 3: Create composite index for queries
CREATE INDEX "job_roles_isActive_sortOrder_idx" ON "job_roles"("isActive", "sortOrder");

-- Step 4: Insert default 7 job roles from enum
INSERT INTO "job_roles" ("id", "key", "label", "description", "sortOrder", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'DATA_ENTRY', 'Data Entry', 'Input dan pengolahan data', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONTENT_WRITER', 'Content Writer', 'Penulisan konten dan artikel', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'GRAPHIC_DESIGNER', 'Graphic Designer', 'Desain grafis dan visual', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'VIDEO_EDITOR', 'Video Editor', 'Editing dan produksi video', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Social Media', 'Pengelolaan media sosial', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'FRONTEND_DEV', 'Frontend Developer', 'Pengembangan antarmuka web', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'UIUX_DESIGNER', 'UI/UX Designer', 'Desain antarmuka dan pengalaman pengguna', 7, NOW(), NOW());

-- Step 5: Add new columns to StudentProfile (jobRoleIds as array)
ALTER TABLE "StudentProfile" ADD COLUMN "jobRoleIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 6: Migrate existing StudentProfile.roles (enum array) to jobRoleIds
-- For each student, convert enum values to JobRole IDs
UPDATE "StudentProfile" sp
SET "jobRoleIds" = (
  SELECT ARRAY_AGG(jr.id)
  FROM unnest(sp.roles::text[]) AS enum_value
  JOIN "job_roles" jr ON jr.key = enum_value
);

-- Step 7: Add jobRoleId column to Job table
ALTER TABLE "Job" ADD COLUMN "jobRoleId" TEXT;

-- Step 8: Migrate existing Job.role (enum) to jobRoleId
UPDATE "Job" j
SET "jobRoleId" = (
  SELECT jr.id
  FROM "job_roles" jr
  WHERE jr.key = j.role::text
);

-- Step 9: Make jobRoleId NOT NULL after data migration
ALTER TABLE "Job" ALTER COLUMN "jobRoleId" SET NOT NULL;

-- Step 10: Add foreign key constraints
ALTER TABLE "Job" ADD CONSTRAINT "Job_jobRoleId_fkey" 
  FOREIGN KEY ("jobRoleId") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 11: Create indexes for foreign keys
CREATE INDEX "Job_jobRoleId_idx" ON "Job"("jobRoleId");
CREATE INDEX "Job_status_jobRoleId_publishedAt_idx" ON "Job"("status", "jobRoleId", "publishedAt");

-- Step 12: Drop old index that used 'role' enum
DROP INDEX IF EXISTS "Job_status_role_publishedAt_idx";

-- Step 13: Migrate DeadlineRule.role to jobRoleId
ALTER TABLE "DeadlineRule" ADD COLUMN "jobRoleId" TEXT;

UPDATE "DeadlineRule" dr
SET "jobRoleId" = (
  SELECT jr.id
  FROM "job_roles" jr
  WHERE jr.key = dr.role::text
);

ALTER TABLE "DeadlineRule" ALTER COLUMN "jobRoleId" SET NOT NULL;

ALTER TABLE "DeadlineRule" ADD CONSTRAINT "DeadlineRule_jobRoleId_fkey"
  FOREIGN KEY ("jobRoleId") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 14: Drop old unique index and create new one
DROP INDEX IF EXISTS "DeadlineRule_role_tier_key";
CREATE UNIQUE INDEX "DeadlineRule_jobRoleId_tier_key" ON "DeadlineRule"("jobRoleId", "tier");

-- ===============================================
-- BACKWARD COMPATIBILITY:
-- Keep old columns for safety, will drop later
-- - StudentProfile.roles (enum array)
-- - Job.role (enum)
-- - DeadlineRule.role (enum)
-- ===============================================

-- NOTE: Run this SQL manually in dev database first!
-- After verification, run: pnpm prisma generate
-- Then deploy to production with: pnpm db:migrate
