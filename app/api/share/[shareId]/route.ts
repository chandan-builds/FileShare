import { jsonError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getShareMetadata } from "@/lib/r2";
import { toPublicShareInfo } from "@/lib/share";
import { assertShareId } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ shareId: string }> },
) {
  const limited = enforceRateLimit(request, "share", 60);
  if (limited) return limited;

  try {
    const { shareId: rawId } = await context.params;
    const shareId = assertShareId(rawId);
    const metadata = await getShareMetadata(shareId);
    return Response.json(toPublicShareInfo(metadata));
  } catch (error) {
    return jsonError(error);
  }
}
