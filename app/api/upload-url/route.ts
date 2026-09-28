import { AppError, jsonError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { buildObjectKey } from "@/lib/file-utils";
import { createPresignedPutUrl } from "@/lib/r2";
import { assertFitsFreeTierQuota, createShareId } from "@/lib/share";
import { assertFileRequest, parseExpiration } from "@/lib/validation";
import { getMaxFileSizeBytes } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "upload-url", 20);
  if (limited) return limited;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const file = assertFileRequest({
      fileName: body.fileName,
      contentType: body.contentType,
      size: body.size,
    });
    parseExpiration(body.expiresIn ?? "7d");
    await assertFitsFreeTierQuota(file.size);

    const shareId = createShareId();
    const objectKey = buildObjectKey(shareId, file.originalFileName);
    const uploadUrl = await createPresignedPutUrl({
      objectKey,
      contentType: file.contentType,
    });

    return Response.json({
      shareId,
      objectKey,
      uploadUrl,
      contentType: file.contentType,
      maxFileSizeBytes: getMaxFileSizeBytes(),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError(new AppError("Invalid upload request.", 400, "INVALID_JSON"));
    }
    return jsonError(error);
  }
}
