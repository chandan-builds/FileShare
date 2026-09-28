function readRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getR2Config() {
  const accountId = readRequired("R2_ACCOUNT_ID");
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    accountId,
    accessKeyId: readRequired("R2_ACCESS_KEY_ID"),
    secretAccessKey: readRequired("R2_SECRET_ACCESS_KEY"),
    bucketName: readRequired("R2_BUCKET_NAME"),
    endpoint,
  };
}

export function getMaxFileSizeMb(): number {
  const raw = process.env.MAX_FILE_SIZE_MB?.trim() || "2048";
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 2048;
  }
  return parsed;
}

export function getMaxFileSizeBytes(): number {
  return getMaxFileSizeMb() * 1024 * 1024;
}

export function getFreeTierStorageGb(): number {
  const raw = process.env.R2_FREE_TIER_STORAGE_GB?.trim() || "9";
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 9;
  }
  return Math.min(parsed, 9);
}

export function getFreeTierStorageBytes(): number {
  return Math.floor(getFreeTierStorageGb() * 1024 * 1024 * 1024);
}

export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function getAllowedCorsOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  const appUrl = getAppUrl();
  if (appUrl.startsWith("http")) {
    origins.add(appUrl);
  }

  const extra = process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [];
  for (const origin of extra) {
    const trimmed = origin.trim().replace(/\/$/, "");
    if (trimmed && trimmed !== "*") {
      origins.add(trimmed);
    }
  }

  return [...origins];
}
