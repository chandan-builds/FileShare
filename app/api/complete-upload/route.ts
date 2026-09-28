import { AppError, jsonError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getShareMetadata, saveShareMetadata } from "@/lib/r2";
import { assertUploadedObject, buildShareUrl, enforceFreeTierAfterUpload } from "@/lib/share";
import {
  assertFileRequest,
  assertObjectKey,
  assertShareId,
  expirationToIso,
  parseExpiration,
} from "@/lib/validation";
import type { ShareMetadata } from "@/types/file";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "complete-upload", 20);
  if (limited) return limited;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const shareId = assertShareId(String(body.shareId ?? ""));
    const objectKey = assertObjectKey(body.objectKey, shareId);
    const file = assertFileRequest({
      fileName: body.fileName,
      contentType: body.contentType,
      size: body.size,
    });
    const expiresIn = parseExpiration(body.expiresIn ?? "7d");

    try {
      const existing = await getShareMetadata(shareId);
      return Response.json({
        shareId: existing.shareId,
        shareUrl: buildShareUrl(existing.shareId),
        originalFileName: existing.originalFileName,
        size: existing.size,
        expiresAt: existing.expiresAt,
      });
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== "METADATA_MISSING") {
        throw error;
      }
    }

    const uploaded = await assertUploadedObject({ objectKey });
    await enforceFreeTierAfterUpload(objectKey, uploaded.size);

    const createdAt = new Date();
    const metadata: ShareMetadata = {
      shareId,
      objectKey,
      originalFileName: file.originalFileName,
      contentType: uploaded.contentType || file.contentType,
      size: uploaded.size,
      createdAt: createdAt.toISOString(),
      expiresAt: expirationToIso(expiresIn, createdAt),
    };

    await saveShareMetadata(metadata);

    return Response.json({
      shareId,
      shareUrl: buildShareUrl(shareId),
      originalFileName: metadata.originalFileName,
      size: metadata.size,
      expiresAt: metadata.expiresAt,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError(new AppError("Invalid upload request.", 400, "INVALID_JSON"));
    }
    return jsonError(error);
  }
}
