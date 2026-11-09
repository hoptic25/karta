import "server-only";
import { head, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import type { User, ImagePurpose } from "@/generated/prisma/client";

export class ImageError extends Error {
  code: string;
  constructor(message: string, code = "IMAGE_ERROR") {
    super(message);
    this.name = "ImageError";
    this.code = code;
  }
}

const uploadRateMap = new Map<string, number[]>();

export function checkUploadRateLimit(userId: string): void {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const uploads = (uploadRateMap.get(userId) || []).filter((t) => now - t < windowMs);

  if (uploads.length >= 10) {
    throw new ImageError(
      "Batas unggah gambar tercapai (maksimal 10 unggahan per jam).",
      "RATE_LIMIT_EXCEEDED"
    );
  }
  uploads.push(now);
  uploadRateMap.set(userId, uploads);
}

export async function assertCanUploadImage({
  user,
  purpose,
  jobId,
  pathname,
}: {
  user: User;
  purpose: ImagePurpose;
  jobId?: string;
  pathname: string;
}) {
  if (user.status === "SUSPENDED") {
    throw new ImageError("Akun dinonaktifkan.", "FORBIDDEN");
  }

  checkUploadRateLimit(user.id);

  // Check prefix
  const purposeFolder = purpose.toLowerCase();
  const validPrefixes = [
    `karta/${purposeFolder}/${user.id}/`,
    ...(purpose === "UMKM_LOGO" ? [`karta/logo/${user.id}/`] : []),
  ];
  const hasValidPrefix = validPrefixes.some((p) => pathname.startsWith(p));
  if (!hasValidPrefix) {
    throw new ImageError("Format path file tidak valid.", "INVALID_PATHNAME");
  }

  if (purpose === "AVATAR") {
    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
      throw new ImageError("Hanya mahasiswa yang dapat mengunggah avatar.", "FORBIDDEN_ROLE");
    }
  } else if (purpose === "UMKM_LOGO") {
    if (user.role !== "UMKM" && user.role !== "ADMIN") {
      throw new ImageError("Hanya UMKM yang dapat mengunggah logo.", "FORBIDDEN_ROLE");
    }
  } else if (purpose === "JOB_REFERENCE") {
    if (user.role !== "UMKM" && user.role !== "ADMIN") {
      throw new ImageError("Hanya UMKM yang dapat mengunggah gambar referensi job.", "FORBIDDEN_ROLE");
    }

    if (!jobId) {
      throw new ImageError("ID pekerjaan wajib disertakan untuk gambar referensi.", "MISSING_JOB_ID");
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { images: true, umkm: true },
    });

    if (!job) {
      throw new ImageError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
    }

    if (user.role !== "ADMIN" && job.umkm.userId !== user.id) {
      throw new ImageError("Anda bukan pemilik pekerjaan ini.", "FORBIDDEN_OWNERSHIP");
    }

    if (job.status !== "DRAFT" && job.status !== "OPEN") {
      throw new ImageError(
        "Gambar referensi hanya dapat ditambahkan pada status Draf atau Terbuka.",
        "INVALID_JOB_STATUS"
      );
    }

    if (job.images.length >= 3) {
      throw new ImageError(
        "Maksimal 3 gambar referensi per pekerjaan.",
        "MAX_IMAGES_EXCEEDED"
      );
    }
  } else {
    throw new ImageError("Tujuan unggah gambar tidak dikenal.", "INVALID_PURPOSE");
  }
}

export async function attachImage({
  userId,
  purpose,
  url,
  pathname,
  jobId,
}: {
  userId: string;
  purpose: ImagePurpose;
  url: string;
  pathname: string;
  jobId?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ImageError("Pengguna tidak ditemukan.", "USER_NOT_FOUND");

  // Validate blob details with head(url)
  let blobDetails;
  try {
    blobDetails = await head(url);
  } catch {
    throw new ImageError("File gambar tidak ditemukan di penyimpanan.", "BLOB_NOT_FOUND");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(blobDetails.contentType)) {
    try {
      await del(url);
    } catch {
      // ignore
    }
    throw new ImageError(
      "Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.",
      "INVALID_CONTENT_TYPE"
    );
  }

  const maxBytes = 2 * 1024 * 1024; // 2MB
  if (blobDetails.size > maxBytes) {
    try {
      await del(url);
    } catch {
      // ignore
    }
    throw new ImageError("Ukuran gambar melebihi batas maksimal 2MB.", "FILE_TOO_LARGE");
  }

  // Transaction to store asset and handle avatar/logo replacement
  return await prisma.$transaction(async (tx) => {
    // If replacing AVATAR or UMKM_LOGO, delete the old asset and blob
    if (purpose === "AVATAR") {
      const oldAsset = await tx.imageAsset.findFirst({
        where: { ownerUserId: user.id, purpose: "AVATAR" },
      });
      if (oldAsset) {
        try {
          await del(oldAsset.url);
        } catch {
          // ignore
        }
        await tx.imageAsset.delete({ where: { id: oldAsset.id } });
      }
      await tx.studentProfile.updateMany({
        where: { userId: user.id },
        data: { avatarUrl: url },
      });
    } else if (purpose === "UMKM_LOGO") {
      const oldAsset = await tx.imageAsset.findFirst({
        where: { ownerUserId: user.id, purpose: "UMKM_LOGO" },
      });
      if (oldAsset) {
        try {
          await del(oldAsset.url);
        } catch {
          // ignore
        }
        await tx.imageAsset.delete({ where: { id: oldAsset.id } });
      }
      await tx.umkmProfile.updateMany({
        where: { userId: user.id },
        data: { logoUrl: url },
      });
    }

    const asset = await tx.imageAsset.create({
      data: {
        ownerUserId: user.id,
        purpose,
        url,
        pathname,
        contentType: blobDetails.contentType,
        sizeBytes: blobDetails.size,
        jobId: purpose === "JOB_REFERENCE" ? jobId : null,
      },
    });

    return asset;
  });
}

export async function removeImage({
  userId,
  assetId,
}: {
  userId: string;
  assetId: string;
}) {
  const asset = await prisma.imageAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new ImageError("Gambar tidak ditemukan.", "NOT_FOUND");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ImageError("Pengguna tidak ditemukan.", "UNAUTHORIZED");

  if (asset.ownerUserId !== user.id && user.role !== "ADMIN") {
    throw new ImageError("Anda tidak memiliki izin menghapus gambar ini.", "FORBIDDEN");
  }

  // Delete from storage
  try {
    await del(asset.url);
  } catch {
    // ignore if already deleted
  }

  // Update profile reference if avatar or logo
  if (asset.purpose === "AVATAR") {
    await prisma.studentProfile.updateMany({
      where: { userId: user.id, avatarUrl: asset.url },
      data: { avatarUrl: null },
    });
  } else if (asset.purpose === "UMKM_LOGO") {
    await prisma.umkmProfile.updateMany({
      where: { userId: user.id, logoUrl: asset.url },
      data: { logoUrl: null },
    });
  }

  await prisma.imageAsset.delete({ where: { id: asset.id } });
  return { id: asset.id };
}
