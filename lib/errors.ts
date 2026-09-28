export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  console.error("Unhandled error", error);
  return Response.json(
    {
      error: "Something went wrong. Please try again.",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}

export function isR2AuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    candidate.name === "InvalidAccessKeyId" ||
    candidate.name === "SignatureDoesNotMatch" ||
    candidate.name === "AccessDenied" ||
    candidate.$metadata?.httpStatusCode === 403
  );
}

export function isR2TimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; message?: string };
  return (
    candidate.name === "TimeoutError" ||
    candidate.name === "AbortError" ||
    /timeout/i.test(candidate.message ?? "")
  );
}
