"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth";
import { attachImage, removeImage } from "./service";
import { failure, success, type Result } from "@/lib/result";
import type { ImagePurpose } from "@/generated/prisma/client";

export async function attachImageAction({
  purpose,
  url,
  pathname,
  jobId,
}: {
  purpose: ImagePurpose;
  url: string;
  pathname: string;
  jobId?: string;
}): Promise<Result<{ id: string; url: string }>> {
  try {
    const user = await requireUser();
    const asset = await attachImage({
      userId: user.id,
      purpose,
      url,
      pathname,
      jobId,
    });
    revalidatePath("/", "layout");
    return success({ id: asset.id, url: asset.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan data gambar.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function removeImageAction(
  assetId: string
): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUser();
    const result = await removeImage({
      userId: user.id,
      assetId,
    });
    revalidatePath("/", "layout");
    return success(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus gambar.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

