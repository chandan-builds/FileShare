export const EXPIRATION_OPTIONS = [
  { value: "5m", label: "5 minutes", seconds: 60 * 5 },
  { value: "15m", label: "15 minutes", seconds: 60 * 15 },
  { value: "30m", label: "30 minutes", seconds: 60 * 30 },
  { value: "1h", label: "1 hour", seconds: 60 * 60 },
] as const;

export type ExpirationValue = (typeof EXPIRATION_OPTIONS)[number]["value"];

export const DEFAULT_EXPIRATION: ExpirationValue = "15m";

export type ShareMetadata = {
  shareId: string;
  objectKey: string;
  originalFileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
};

export type PublicShareInfo = {
  shareId: string;
  originalFileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
  expired: boolean;
};

export type UploadUrlResponse = {
  shareId: string;
  objectKey: string;
  uploadUrl: string;
  contentType: string;
  maxFileSizeBytes: number;
};

export type CompleteUploadResponse = {
  shareId: string;
  shareUrl: string;
  originalFileName: string;
  size: number;
  expiresAt: string | null;
};
