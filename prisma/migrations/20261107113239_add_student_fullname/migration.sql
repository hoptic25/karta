/*
  Warnings:

  - You are about to drop the column `role` on the `DeadlineRule` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `StudentProfile` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `StudentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JobRoleEnum" AS ENUM ('DATA_ENTRY', 'CONTENT_WRITER', 'GRAPHIC_DESIGNER', 'VIDEO_EDITOR', 'SOCIAL_MEDIA', 'FRONTEND_DEV', 'UIUX_DESIGNER');

-- AlterTable
ALTER TABLE "DeadlineRule" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "roles",
ADD COLUMN     "fullName" TEXT NOT NULL,
ALTER COLUMN "jobRoleIds" DROP DEFAULT;

-- DropEnum
DROP TYPE "JobRole";

-- CreateTable
CREATE TABLE "_StudentJobRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentJobRoles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StudentJobRoles_B_index" ON "_StudentJobRoles"("B");

-- AddForeignKey
ALTER TABLE "_StudentJobRoles" ADD CONSTRAINT "_StudentJobRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentJobRoles" ADD CONSTRAINT "_StudentJobRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
