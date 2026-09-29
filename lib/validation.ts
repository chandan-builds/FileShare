import { EXPIRATION_OPTIONS, type ExpirationValue } from "@/types/file";
import { AppError } from "@/lib/errors";
import {
  isSafeObjectKey,
  normalizeContentType,
  sanitizeFileName,
} from "@/lib/file-utils";
import { getMaxFileSizeBytes, getMaxFileSizeMb } from "@/lib/env";

export const SHARE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertShareId(shareId: string): string {
  const trimmed = shareId.trim();
  if (!SHARE_ID_PATTERN.test(trimmed)) {
    throw new AppError("This share link is invalid.", 400, "INVALID_SHARE_ID");
  }
  return trimmed.toLowerCase();
}

export function parseExpiration(value: unknown): ExpirationValue {
  const match = EXPIRATION_OPTIONS.find((option) => option.value === value);
  if (!match) {
    throw new AppError("Choose a valid expiration option.", 400, "INVALID_EXPIRATION");
  }
  return match.value;
}

export function expirationToIso(value: ExpirationValue, from = new Date()): string {
  const option = EXPIRATION_OPTIONS.find((item) => item.value === value);
  const seconds = option?.seconds ?? 60 * 15;
  return new Date(from.getTime() + seconds * 1000).toISOString();
}

export function isExpired(expiresAt: string | null, now = new Date()): boolean {
  if (!expiresAt) return true;
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return true;
  return expires.getTime() <= now.getTime();
}

export function assertFileRequest(input: {
  fileName?: unknown;
  contentType?: unknown;
  size?: unknown;
}) {
  if (typeof input.fileName !== "string" || input.fileName.trim().length === 0) {
    throw new AppError("A file name is required.", 400, "MISSING_FILE_NAME");
  }

  if (input.fileName.length > 255) {
    throw new AppError("The file name is too long.", 400, "FILE_NAME_TOO_LONG");
  }

  const originalFileName = sanitizeFileName(input.fileName);

  if (typeof input.size !== "number" || !Number.isFinite(input.size) || input.size < 0) {
    throw new AppError("A valid file size is required.", 400, "INVALID_FILE_SIZE");
  }

  const size = Math.floor(input.size);
  if (size === 0) {
    throw new AppError("The selected file is empty.", 400, "EMPTY_FILE");
  }

  const maxBytes = getMaxFileSizeBytes();
  if (size > maxBytes) {
    throw new AppError(
      `This file is too large. The maximum size is ${getMaxFileSizeMb()} MB.`,
      413,
      "FILE_TOO_LARGE",
    );
  }

  return {
    originalFileName,
    contentType: normalizeContentType(
      typeof input.contentType === "string" ? input.contentType : undefined,
    ),
    size,
  };
}

export function assertObjectKey(objectKey: unknown, shareId: string): string {
  if (typeof objectKey !== "string") {
    throw new AppError("Upload information is incomplete.", 400, "INVALID_OBJECT_KEY");
  }
  if (!isSafeObjectKey(objectKey) || !objectKey.startsWith(`files/${shareId}/`)) {
    throw new AppError("Upload information is invalid.", 400, "INVALID_OBJECT_KEY");
  }
  return objectKey;
}
