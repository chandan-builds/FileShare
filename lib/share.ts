import { randomUUID } from "node:crypto";
import {
  getAppUrl,
  getFreeTierStorageBytes,
  getFreeTierStorageGb,
  getMaxFileSizeBytes,
} from "@/lib/env";
import { AppError } from "@/lib/errors";
import { formatBytes } from "@/lib/file-utils";
import { deleteObject, getUsedStorageBytes, headObject } from "@/lib/r2";
import { isExpired } from "@/lib/validation";
import type { PublicShareInfo, ShareMetadata } from "@/types/file";

export function createShareId(): string {
  return randomUUID();
}

export function buildShareUrl(shareId: string): string {
  return `${getAppUrl()}/s/${shareId}`;
}

export function toPublicShareInfo(metadata: ShareMetadata): PublicShareInfo {
  return {
    shareId: metadata.shareId,
    originalFileName: metadata.originalFileName,
    contentType: metadata.contentType,
    size: metadata.size,
    createdAt: metadata.createdAt,
    expiresAt: metadata.expiresAt,
    expired: isExpired(metadata.expiresAt),
  };
}

export async function assertUploadedObject(metadataLike: {
  objectKey: string;
  size?: number;
}) {
  const head = await headObject(metadataLike.objectKey);
  const actualSize = head.ContentLength ?? 0;

  if (actualSize <= 0) {
    throw new AppError("The upload did not complete.", 409, "UPLOAD_INCOMPLETE");
  }

  if (actualSize > getMaxFileSizeBytes()) {
    await deleteObject(metadataLike.objectKey);
    throw new AppError("This file is too large.", 413, "FILE_TOO_LARGE");
  }

  return {
    size: actualSize,
    contentType: head.ContentType,
    eTag: head.ETag,
  };
}

export async function assertFitsFreeTierQuota(incomingBytes: number) {
  const used = await getUsedStorageBytes();
  const limit = getFreeTierStorageBytes();
  const remaining = Math.max(0, limit - used);

  if (incomingBytes > remaining) {
    throw new AppError(
      remaining <= 0
        ? `Free storage is full. This app stays under ${getFreeTierStorageGb()} GB so R2 never bills overage.`
        : `This file would exceed the free ${getFreeTierStorageGb()} GB cap. ${formatBytes(remaining)} remaining.`,
      413,
      "STORAGE_QUOTA",
    );
  }

  return { used, remaining, limit };
}

export async function enforceFreeTierAfterUpload(objectKey: string, uploadedBytes: number) {
  const used = await getUsedStorageBytes();
  const limit = getFreeTierStorageBytes();
  const usedWithoutThis = Math.max(0, used - uploadedBytes);

  if (usedWithoutThis + uploadedBytes > limit) {
    await deleteObject(objectKey);
    throw new AppError(
      `This file would exceed the free ${getFreeTierStorageGb()} GB cap, so it was not kept.`,
      413,
      "STORAGE_QUOTA",
    );
  }
}

export function assertNotExpired(metadata: ShareMetadata) {
  if (isExpired(metadata.expiresAt)) {
    throw new AppError("This file has expired.", 410, "FILE_EXPIRED");
  }
}
