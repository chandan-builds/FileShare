import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createPresignedGetUrl, getShareMetadata, headObject } from "@/lib/r2";
import { assertNotExpired } from "@/lib/share";
import { assertShareId } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shareId: string }> },
) {
  const limited = enforceRateLimit(request, "download", 40);
  if (limited) return limited;

  try {
    const { shareId: rawId } = await context.params;
    const shareId = assertShareId(rawId);
    const metadata = await getShareMetadata(shareId);
    assertNotExpired(metadata);
    await headObject(metadata.objectKey);

    const downloadUrl = await createPresignedGetUrl({
      objectKey: metadata.objectKey,
      fileName: metadata.originalFileName,
      contentType: metadata.contentType,
    });

    if (request.nextUrl.searchParams.get("redirect") === "1") {
      return Response.redirect(downloadUrl, 302);
    }

    return Response.json({
      downloadUrl,
      fileName: metadata.originalFileName,
      contentType: metadata.contentType,
      size: metadata.size,
      expiresInSeconds: 600,
    });
  } catch (error) {
    return jsonError(error);
  }
}
