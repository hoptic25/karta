-- CreateTable
CREATE TABLE "JobRoleMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRoleMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobRoleMaster_code_key" ON "JobRoleMaster"("code");

-- Insert existing job roles
INSERT INTO "JobRoleMaster" ("id", "code", "label", "description", "isActive", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'DATA_ENTRY', 'Data Entry', 'Pekerjaan input dan pengolahan data', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'CONTENT_WRITER', 'Content Writer', 'Pekerjaan penulisan konten', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'GRAPHIC_DESIGNER', 'Graphic Designer', 'Pekerjaan desain grafis', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'VIDEO_EDITOR', 'Video Editor', 'Pekerjaan editing video', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'SOCIAL_MEDIA', 'Social Media', 'Pekerjaan manajemen media sosial', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'FRONTEND_DEV', 'Frontend Developer', 'Pekerjaan pengembangan frontend', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'UIUX_DESIGNER', 'UI/UX Designer', 'Pekerjaan desain UI/UX', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
