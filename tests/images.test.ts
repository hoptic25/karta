import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  assertCanUploadImage,
  attachImage,
} from "../src/features/images/service";
import { prisma } from "../src/lib/db";
import { head, del } from "@vercel/blob";
import type { User } from "@/generated/prisma/client";

vi.mock("@vercel/blob", () => ({
  head: vi.fn(),
  del: vi.fn(),
  put: vi.fn(),
}));

vi.mock("../src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
    },
    imageAsset: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    studentProfile: {
      updateMany: vi.fn(),
    },
    umkmProfile: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      return cb(prisma);
    }),
  },
}));

describe("Image Service & Storage (BR-I1 - BR-I5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const studentUser: User = {
    id: "student-1",
    email: "student@kampus.ac.id",
    password: null,
    name: "Mahasiswa Karta",
    image: null,
    emailVerified: null,
    role: "STUDENT",
    status: "ACTIVE",
    isCampusEmail: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const umkmUser: User = {
    id: "umkm-1",
    email: "umkm@toko.com",
    password: null,
    name: "Toko Berkah",
    image: null,
    emailVerified: null,
    role: "UMKM",
    status: "ACTIVE",
    isCampusEmail: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("rejects invalid pathname prefix", async () => {
    await expect(
      assertCanUploadImage({
        user: studentUser,
        purpose: "AVATAR",
        pathname: "uploads/avatar.png",
      })
    ).rejects.toThrow("Format path file tidak valid.");
  });

  it("rejects non-student attempting to upload avatar", async () => {
    await expect(
      assertCanUploadImage({
        user: umkmUser,
        purpose: "AVATAR",
        pathname: `karta/avatar/${umkmUser.id}/pic.jpg`,
      })
    ).rejects.toThrow("Hanya mahasiswa yang dapat mengunggah avatar.");
  });

  it("rejects non-umkm attempting to upload logo", async () => {
    await expect(
      assertCanUploadImage({
        user: studentUser,
        purpose: "UMKM_LOGO",
        pathname: `karta/umkm_logo/${studentUser.id}/logo.png`,
      })
    ).rejects.toThrow("Hanya UMKM yang dapat mengunggah logo.");
  });

  it("rejects job reference upload without jobId", async () => {
    await expect(
      assertCanUploadImage({
        user: umkmUser,
        purpose: "JOB_REFERENCE",
        pathname: `karta/job_reference/${umkmUser.id}/ref1.jpg`,
      })
    ).rejects.toThrow("ID pekerjaan wajib disertakan untuk gambar referensi.");
  });

  it("rejects job reference upload if job belongs to another UMKM", async () => {
    vi.mocked(prisma.job.findUnique).mockResolvedValue({
      id: "job-other",
      umkm: { userId: "other-user-99" },
      status: "DRAFT",
      images: [],
    } as never);

    await expect(
      assertCanUploadImage({
        user: umkmUser,
        purpose: "JOB_REFERENCE",
        jobId: "job-other",
        pathname: `karta/job_reference/${umkmUser.id}/ref1.jpg`,
      })
    ).rejects.toThrow("Anda bukan pemilik pekerjaan ini.");
  });

  it("rejects job reference upload if job is already CLAIMED", async () => {
    vi.mocked(prisma.job.findUnique).mockResolvedValue({
      id: "job-claimed",
      umkm: { userId: umkmUser.id },
      status: "CLAIMED",
      images: [],
    } as never);

    await expect(
      assertCanUploadImage({
        user: umkmUser,
        purpose: "JOB_REFERENCE",
        jobId: "job-claimed",
        pathname: `karta/job_reference/${umkmUser.id}/ref1.jpg`,
      })
    ).rejects.toThrow(
      "Gambar referensi hanya dapat ditambahkan pada status Draf atau Terbuka."
    );
  });

  it("rejects job reference upload if already has 3 images", async () => {
    vi.mocked(prisma.job.findUnique).mockResolvedValue({
      id: "job-full",
      umkm: { userId: umkmUser.id },
      status: "OPEN",
      images: [{ id: "img-1" }, { id: "img-2" }, { id: "img-3" }],
    } as never);

    await expect(
      assertCanUploadImage({
        user: umkmUser,
        purpose: "JOB_REFERENCE",
        jobId: "job-full",
        pathname: `karta/job_reference/${umkmUser.id}/ref4.jpg`,
      })
    ).rejects.toThrow("Maksimal 3 gambar referensi per pekerjaan.");
  });

  it("attaches image successfully and removes old avatar when uploading new avatar", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(studentUser);
    vi.mocked(head).mockResolvedValue({
      contentType: "image/webp",
      size: 500_000,
      url: "https://blob.vercel.com/karta/avatar/student-1/new.webp",
    } as never);

    vi.mocked(prisma.imageAsset.findFirst).mockResolvedValue({
      id: "old-asset-1",
      url: "https://blob.vercel.com/karta/avatar/student-1/old.webp",
    } as never);

    vi.mocked(prisma.imageAsset.create).mockResolvedValue({
      id: "new-asset-1",
      url: "https://blob.vercel.com/karta/avatar/student-1/new.webp",
      ownerUserId: studentUser.id,
      purpose: "AVATAR",
      contentType: "image/webp",
      sizeBytes: 500_000,
    } as never);

    const asset = await attachImage({
      userId: studentUser.id,
      purpose: "AVATAR",
      url: "https://blob.vercel.com/karta/avatar/student-1/new.webp",
      pathname: `karta/avatar/${studentUser.id}/new.webp`,
    });

    expect(del).toHaveBeenCalledWith(
      "https://blob.vercel.com/karta/avatar/student-1/old.webp"
    );
    expect(prisma.imageAsset.delete).toHaveBeenCalledWith({
      where: { id: "old-asset-1" },
    });
    expect(asset.id).toBe("new-asset-1");
  });
});
